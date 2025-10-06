#!/bin/bash
set -euo pipefail

log() {
  if timestamp=$(date --iso-8601=seconds 2>/dev/null); then :; else timestamp=$(date +"%Y-%m-%dT%H:%M:%S%z"); fi
  echo "[$timestamp] $*"
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
  local url="http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token"
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
      echo "$token"
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
    if DOCKER_CONFIG="$DOCKER_CONFIG" docker pull "$IMAGE" 2>&1 | tee /tmp/docker_pull.log | head -n 10; then
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
      if DOCKER_CONFIG="$DOCKER_CONFIG" docker pull "$IMAGE" 2>&1 | head -n 10; then
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
  local sm_url

  # Acquire token (for Secret Manager)
  TOKEN=$(get_metadata_token) || {
    log "ERROR: Failed to get token for Secret Manager"
    return 1
  }

  if [[ "$secret_ref" == *"/"* ]]; then
    sm_url="https://secretmanager.googleapis.com/v1/${secret_ref}/versions/latest:access"
  else
    sm_url="https://secretmanager.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/secrets/${secret_ref}/versions/latest:access"
  fi

  log "Fetching secret $secret_ref"
  local resp=$(curl -fsS -H "Authorization: Bearer ${TOKEN}" "$sm_url" || true)

  if [ -z "$resp" ]; then
    log "ERROR: Empty response for secret $secret_ref"
    return 1
  fi

  local data_b64=$(echo "$resp" | extract_json_field data)
  if [ -z "$data_b64" ]; then
    log "ERROR: Secret $secret_ref missing data field"
    log "Response preview: ${resp:0:200}"
    return 1
  fi

  local value=$(echo "$data_b64" | b64_decode)
  export "$env_name"="$value"
  log "Secret $secret_ref loaded into $env_name"
}

if [ -n "${SECRET_MAP:-}" ]; then
  IFS=',' read -ra PAIRS <<<"$SECRET_MAP"
  for pair in "${PAIRS[@]}"; do
    secret_name="${pair%%:*}"
    env_var="${pair#*:}"
    fetch_secret "$secret_name" "$env_var" || exit 1
  done
elif [ -n "${SECRET_NAMES:-}" ]; then
  IFS=',' read -ra NAMES <<<"$SECRET_NAMES"
  for name in "${NAMES[@]}"; do
    fetch_secret "$name" "$name" || exit 1
  done
else
  fetch_secret "DISCORD_BOT_TOKEN" "DISCORD_BOT_TOKEN" || exit 1
fi

###############################################################################
# Run container
###############################################################################

# Already pulled, just run
DOCKER_CONFIG="$DOCKER_CONFIG" docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

log "Starting container $CONTAINER_NAME"
DOCKER_CONFIG="$DOCKER_CONFIG" docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -e ENVIRONMENT="$ENVIRONMENT" \
  -e CLOUD_RUN_API_SERVICE_URL="$CLOUD_RUN_API_SERVICE_URL" \
  -e DISCORD_BOT_TOKEN="${DISCORD_BOT_TOKEN:-}" \
  "$IMAGE"

trap 'log "Termination signal, stopping container"; DOCKER_CONFIG="$DOCKER_CONFIG" docker stop -t 30 "$CONTAINER_NAME" || true; exit 0' SIGTERM SIGINT

log "Streaming logs from $CONTAINER_NAME"
DOCKER_CONFIG="$DOCKER_CONFIG" docker logs -f "$CONTAINER_NAME" &
while true; do sleep 60; done
