#!/bin/bash
set -euo pipefail

log() {
  if timestamp=$(date --iso-8601=seconds 2>/dev/null); then :; else timestamp=$(date +"%Y-%m-%dT%H:%M:%S%z"); fi
  echo "[$timestamp] $*" 1>&2
}

log "startup.sh: begin"

###############################################################################
# Required environment variables
###############################################################################

CONTAINER_NAME="${APP_NAME}"
IMAGE="${IMAGE}"
REGION="${REGION}"
ENVIRONMENT="${ENVIRONMENT}"
GOOGLE_CLOUD_PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID}"
CLOUD_RUN_API_SERVICE_URL="${CLOUD_RUN_API_SERVICE_URL}"
LOG_FORMAT="${LOG_FORMAT}"

: "${CONTAINER_NAME:?APP_NAME is required}"
: "${IMAGE:?IMAGE is required}"
: "${REGION:?REGION is required}"
: "${ENVIRONMENT:?ENVIRONMENT is required}"
: "${GOOGLE_CLOUD_PROJECT_ID:?GOOGLE_CLOUD_PROJECT_ID is required}"
: "${CLOUD_RUN_API_SERVICE_URL:?CLOUD_RUN_API_SERVICE_URL is required}"

###############################################################################
# Helper functions
###############################################################################

metadata_ready_wait() {
  local url="http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token"
  for i in $(seq 1 10); do
    if curl -fs -H "Metadata-Flavor: Google" "$url" -o /dev/null 2>/dev/null; then
      log "Metadata server is ready (after $i attempt(s))"
      return 0
    fi
    log "Waiting for metadata server... ($i/10)"
    sleep 2
  done
  log "ERROR: Metadata server not responding after retries"
  return 1
}

extract_json_field() {
  local key="$1"
  sed -nE 's/.*"'$key'"\s*:\s*"([^"]+)".*/\1/p'
}

get_metadata_token() {
  local url="http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token?scopes=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform"
  local token_json token

  # Check service account
  local sa_email=$(curl -fsS -H "Metadata-Flavor: Google" \
    "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/email" || echo "unknown")
  log "Using service account: $sa_email"

  for i in $(seq 1 3); do
    log "Attempt $i: retrieving metadata token..."
    token_json=$(curl -fsS -H "Metadata-Flavor: Google" "$url" || true)
    token=$(echo "$token_json" | extract_json_field access_token || true)
    if [ -n "$token" ]; then
      echo -n "$token"
      return 0
    fi
    log "Token empty or invalid JSON, retrying ($i)..."
    sleep 2
  done
  return 1
}

b64_decode() {
  if command -v base64 >/dev/null 2>&1; then base64 --decode; else openssl base64 -d -A; fi
}

###############################################################################
# Docker availability
###############################################################################

log "Checking docker availability..."
command -v docker >/dev/null 2>&1 || {
  log "ERROR: docker not found"
  exit 1
}

###############################################################################
# Docker authentication settings for Container-Optimized OS
###############################################################################

# General: Determine writable DOCKER_CONFIG
ensure_docker_config() {
  if [ -n "${DOCKER_CONFIG:-}" ] && mkdir -p "$DOCKER_CONFIG" 2>/dev/null && [ -w "$DOCKER_CONFIG" ]; then
    return 0
  fi
  for d in /var/lib/google/docker-config /home/docker/.docker /tmp/docker-config; do
    if mkdir -p "$d" 2>/dev/null && [ -w "$d" ]; then
      export DOCKER_CONFIG="$d"
      return 0
    fi
  done
  log "ERROR: No writable DOCKER_CONFIG directory found"
  return 1
}

setup_docker_gcr_auth() {
  log "Setting up Docker authentication for Container-Optimized OS..."

  ensure_docker_config || return 1
  log "Using DOCKER_CONFIG at: $DOCKER_CONFIG"

  if [ -x /usr/bin/docker-credential-gcr ]; then
    log "Found docker-credential-gcr at /usr/bin/docker-credential-gcr"

    # Explicitly set credHelpers ($DOCKER_CONFIG/config.json)
    mkdir -p "$DOCKER_CONFIG"
    cat >"$DOCKER_CONFIG/config.json" <<EOF
{
  "credHelpers": {
    "${REGION}-docker.pkg.dev": "gcr",
    "gcr.io": "gcr",
    "us.gcr.io": "gcr",
    "eu.gcr.io": "gcr",
    "asia.gcr.io": "gcr"
  }
}
EOF

    # Explicitly use metadata server
    export GOOGLE_APPLICATION_CREDENTIALS=""
    export GCE_METADATA_HOST="169.254.169.254"

    # Set helper respecting DOCKER_CONFIG
    DOCKER_CONFIG="$DOCKER_CONFIG" /usr/bin/docker-credential-gcr configure-docker --registries="${REGION}-docker.pkg.dev" || true

    log "docker-credential-gcr configured"
    return 0
  fi

  log "docker-credential-gcr not found at expected location"
  return 1
}

###############################################################################
# Artifact Registry authentication
###############################################################################

metadata_ready_wait

DEFAULT_REGISTRY="${REGION}-docker.pkg.dev"
IMAGE_REGISTRY="${IMAGE%%/*}"
if [[ "$IMAGE_REGISTRY" == *".pkg.dev" ]]; then
  REGISTRY_HOST="$IMAGE_REGISTRY"
else
  REGISTRY_HOST="$DEFAULT_REGISTRY"
fi

log "Registry details:"
log "  - IMAGE: $IMAGE"
log "  - REGISTRY_HOST: $REGISTRY_HOST"
log "  - Project: $GOOGLE_CLOUD_PROJECT_ID"

# Authentication settings for Container-Optimized OS
login_success=false

# Method 1: Use docker-credential-gcr (recommended)
if setup_docker_gcr_auth; then
  log "Testing Docker pull with credential helper..."

  # Attempt pull (credential helper handles authentication automatically)
  for i in $(seq 1 3); do
    log "Attempt $i/3: Pulling image with credential helper..."
    if DOCKER_CONFIG="$DOCKER_CONFIG" docker pull "$IMAGE" 2>&1 | tee /tmp/docker_pull.log; then
      log "Successfully authenticated and pulled image"
      login_success=true
      break
    else
      log "Pull failed, retrying..."
      tail -n 5 /tmp/docker_pull.log || true
    fi
    sleep 2
  done
fi

# Method 2: Direct authentication with metadata token (fallback)
if [ "$login_success" != "true" ]; then
  log "Falling back to oauth2accesstoken authentication..."

  TOKEN=$(get_metadata_token) || {
    log "ERROR: Failed to get metadata token"
    exit 1
  }

  for i in $(seq 1 3); do
    log "Attempt $i/3: Docker login with oauth2accesstoken..."

    # Login with protocol
    if echo "$TOKEN" | DOCKER_CONFIG="$DOCKER_CONFIG" docker login -u oauth2accesstoken --password-stdin "https://${REGISTRY_HOST}" 2>&1 | tee /tmp/docker_login.log; then
      log "Docker login succeeded"

      # After successful login, attempt pull
      if DOCKER_CONFIG="$DOCKER_CONFIG" docker pull "$IMAGE" 2>&1 | tee /tmp/docker_pull_fallback.log; then
        login_success=true
        break
      fi
    else
      log "Docker login failed"
      cat /tmp/docker_login.log || true

      # Reacquire token
      TOKEN=$(get_metadata_token) || log "Token refresh failed"
    fi
    sleep 2
  done
fi

if [ "$login_success" != "true" ]; then
  log "ERROR: Docker authentication failed"
  log ""
  log "Debug information:"
  log "  - Service Account: $(curl -sH 'Metadata-Flavor: Google' http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/email)"
  log "  - Scopes: $(curl -sH 'Metadata-Flavor: Google' http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/scopes | head -n 3)"
  log "  - Registry: ${REGISTRY_HOST}"
  log "  - Image: ${IMAGE}"
  log ""
  log "Please verify IAM permissions and registry access"
  exit 1
fi

###############################################################################
# Secret Manager
###############################################################################

fetch_secret() {
  local secret_ref="$1" env_name="$2"
  local sm_url status resp_file header_file data_b64 value token_len attempt
  local TOKEN token_preview

  # Acquire token (for Secret Manager)
  TOKEN=$(get_metadata_token) || {
    log "ERROR: Failed to get token for Secret Manager"
    return 1
  }
  TOKEN=$(echo -n "$TOKEN" | tr -d '\n' | tr -d '\r')
  token_len=${#TOKEN}
  if [ "$token_len" -lt 10 ]; then
    log "ERROR: Metadata token seems invalid (length=$token_len)"
    return 1
  fi
  token_preview=$(printf "%s" "$TOKEN" | cut -c1-12)"..."

  # Determine base project candidates
  local primary_project="${SECRET_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT_ID}}"
  local sa_email sa_project
  sa_email=$(curl -fsS -H "Metadata-Flavor: Google" \
    "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/email" || echo "")
  sa_project=$(echo "$sa_email" | sed -nE 's/^[^@]+@([^.]*)\.iam\.gserviceaccount\.com$/\1/p')

  # Build list of candidate projects (unique, non-empty)
  local candidates=()
  if [ -n "$primary_project" ]; then candidates+=("$primary_project"); fi
  if [ -n "$sa_project" ] && [ "$sa_project" != "$primary_project" ]; then candidates+=("$sa_project"); fi

  resp_file="/tmp/secret_${env_name}.json"
  header_file="/tmp/secret_${env_name}.headers"
  : >"$resp_file"
  : >"$header_file"

  status="000"

  for project in "${candidates[@]}"; do
    if [[ "$secret_ref" == *"/"* ]]; then
      sm_url="https://secretmanager.googleapis.com/v1/${secret_ref}/versions/latest:access"
    else
      sm_url="https://secretmanager.googleapis.com/v1/projects/${project}/secrets/${secret_ref}/versions/latest:access"
    fi

    log "Fetching secret $secret_ref (project=$project; token=${token_preview})"

    for attempt in 1 2 3; do
      if [ -n "${BILLING_PROJECT_ID:-}" ]; then extra_header=(-H "x-goog-user-project: ${BILLING_PROJECT_ID}"); else extra_header=(); fi
      status=$(curl -sS -D "$header_file" -o "$resp_file" -w "%{http_code}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Accept: application/json" \
        "${extra_header[@]}" \
        "$sm_url" || echo "000")
      if [ "$status" = "200" ]; then
        break
      fi
      log "Fetch attempt $attempt failed ($status); retrying..."
      TOKEN=$(get_metadata_token || echo "")
      TOKEN=$(echo -n "$TOKEN" | tr -d '\n' | tr -d '\r')
      token_preview=$(printf "%s" "$TOKEN" | cut -c1-12)"..."
      sleep 1
    done

    if [ "$status" = "200" ]; then
      break
    fi

    log "Project $project failed with status $status; trying next candidate if any"
  done

  if [ "$status" != "200" ]; then
    log "ERROR: Secret fetch failed ($status) for $secret_ref"
    log "Response preview: $(head -c 300 \"$resp_file\" 2>/dev/null || true)"
    log "Headers preview: $(grep -iE '^(www-authenticate|x-goog-)' \"$header_file\" 2>/dev/null | head -n 5 | tr '\n' ' ' || true)"
    log "Debug SA: $(curl -sS -H 'Metadata-Flavor: Google' http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/email || true)"
    log "Debug Scopes: $(curl -sS -H 'Metadata-Flavor: Google' http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/scopes || true)"
    return 1
  fi

  # Detect and handle gzip-encoded responses
  body_file="$resp_file"
  if command -v gzip >/dev/null 2>&1 && grep -qi '^Content-Encoding: gzip' "$header_file" 2>/dev/null; then
    if gzip -dc "$resp_file" >"${resp_file}.dec" 2>/dev/null; then
      body_file="${resp_file}.dec"
    fi
  fi

  # Log basic diagnostics for successful response
  ct=$(grep -i '^Content-Type:' "$header_file" 2>/dev/null | head -n1 | cut -d' ' -f2- | tr -d '\r')
  ce=$(grep -i '^Content-Encoding:' "$header_file" 2>/dev/null | head -n1 | cut -d' ' -f2- | tr -d '\r')
  sz=$(wc -c <"$body_file" | tr -d ' \n' 2>/dev/null || echo 0)
  log "Secret response: size=${sz}B; content-type=${ct:-unknown}; encoding=${ce:-none}"

  # Extract base64 data from JSON (robust to whitespace/newlines)
  data_b64=$(tr -d '\r\n' <"$body_file" | sed -nE 's/.*"payload"\s*:\s*\{[^}]*"data"\s*:\s*"([^"]+)".*/\1/p')
  if [ -z "$data_b64" ]; then
    data_b64=$(tr -d '\r\n' <"$body_file" | sed -nE 's/.*"data"\s*:\s*"([^"]+)".*/\1/p')
  fi

  if [ -z "$data_b64" ]; then
    log "ERROR: Secret $secret_ref missing data field"
    # Print a sanitized preview to avoid binary/control chars flooding logs
    preview=$(tr -dc '\n\r\t\040-\176' <"$body_file" 2>/dev/null | head -c 300)
    log "Response preview: ${preview}"
    return 1
  fi

  value=$(printf "%s" "$data_b64" | tr -d '\n' | tr -d '\r' | b64_decode)
  export "$env_name"="$value"
  log "Secret $secret_ref loaded into $env_name"
}

SECRET_ENVS=()

if [ -n "${SECRET_NAMES:-}" ]; then
  IFS=',' read -ra NAMES <<<"$SECRET_NAMES"
  for name in "${NAMES[@]}"; do
    name="${name//[[:space:]]/}"
    [ -z "$name" ] && continue
    fetch_secret "$name" "$name" || exit 1
    SECRET_ENVS+=("$name")
  done
fi

###############################################################################
# Run container
###############################################################################

# Already pulled, just run
DOCKER_CONFIG="$DOCKER_CONFIG" docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

log "Starting container $CONTAINER_NAME"
RUN_ARGS=(docker run -d
  --name "$CONTAINER_NAME"
  --restart unless-stopped
  -e ENVIRONMENT="$ENVIRONMENT"
  -e CLOUD_RUN_API_SERVICE_URL="$CLOUD_RUN_API_SERVICE_URL"
  -e LOG_FORMAT="$LOG_FORMAT"
)

for v in "${SECRET_ENVS[@]}"; do
  RUN_ARGS+=(-e "$v=${!v}")
done

DOCKER_CONFIG="$DOCKER_CONFIG" "${RUN_ARGS[@]}" "$IMAGE"

trap 'log "Termination signal, stopping container"; DOCKER_CONFIG="$DOCKER_CONFIG" docker stop -t 30 "$CONTAINER_NAME" || true; exit 0' SIGTERM SIGINT

log "Streaming logs from $CONTAINER_NAME"
DOCKER_CONFIG="$DOCKER_CONFIG" docker logs -f "$CONTAINER_NAME" &
while true; do sleep 60; done
