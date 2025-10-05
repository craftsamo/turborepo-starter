#!/bin/bash
set -euo pipefail

echo "[$(date --iso-8601=seconds)] startup.sh: begin"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

###############################################################################
# Environment validation (values are expected to be substituted by envsubst)
###############################################################################

CONTAINER_NAME="${APP_NAME}"
IMAGE="${IMAGE}"
REGION="${REGION}"
ENVIRONMENT="${ENVIRONMENT}"
GOOGLE_CLOUD_PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID}"
CLOUD_RUN_API_SERVICE_URL="${CLOUD_RUN_API_SERVICE_URL}"

: "${CONTAINER_NAME?:CONTAINER_NAME must be set by envsubst}"
: "${IMAGE:?IMAGE must be set by envsubst}"
: "${REGION:?REGION must be set by envsubst}"
: "${ENVIRONMENT:?ENVIRONMENT must be set by envsubst}"
: "${GOOGLE_CLOUD_PROJECT_ID:?GOOGLE_CLOUD_PROJECT_ID must be set by envsubst}"
: "${CLOUD_RUN_API_SERVICE_URL:?CLOUD_RUN_API_SERVICE_URL must be set by envsubst}"

###############################################################################
# Helpers
###############################################################################

# Simple JSON field extractor (avoids jq dependency)
extract_json_field() {
  local key="$1"
  sed -nE 's/.*"'$key'"\s*:\s*"([^"]+)".*/\1/p'
}

# Get GCE metadata access token
get_metadata_token() {
  local url="http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token"
  local token_json
  for i in 1 2 3; do
    log "Attempt $i: fetching metadata token from $url"
    token_json=$(curl -fsS -H "Metadata-Flavor: Google" "$url" || true)
    if [ -n "$token_json" ]; then
      echo "$token_json" | extract_json_field access_token
      return 0
    fi
    log "retrying metadata token fetch ($i)"
    sleep 1
  done
  return 1
}

# Base64 decode helper
b64_decode() {
  if command -v base64 >/dev/null 2>&1; then
    base64 --decode
  else
    openssl base64 -d
  fi
}

###############################################################################
# Runtime checks
###############################################################################

log "Checking docker availability..."
if ! command -v docker >/dev/null 2>&1; then
  log "docker not found. Exiting."
  exit 1
fi

###############################################################################
# Authenticate to Artifact Registry via metadata token
###############################################################################

log "Retrieving metadata token for Artifact Registry login..."
TOKEN=$(get_metadata_token) || {
  log "Failed to get metadata token"
  exit 1
}

REGISTRY="${REGION}-docker.pkg.dev"
log "Logging into Artifact Registry at ${REGISTRY}..."
if ! docker login -u oauth2accesstoken -p "${TOKEN}" "${REGISTRY}"; then
  log "Docker login failed"
  exit 1
fi

###############################################################################
# Fetch secrets from Secret Manager if not provided via env
# Supports two options:
#  - SECRET_NAMES: comma-separated list of secret resource names (short names)
#      e.g. SECRET_NAMES="DISCORD_BOT_TOKEN,ANOTHER_SECRET"
#    maps each secret name to an env var with the same name
#  - SECRET_MAP: comma-separated list of mappings secret_name:ENV_VAR
#      e.g. SECRET_MAP="DISCORD_BOT_TOKEN:DISCORD_BOT_TOKEN,projects/.../secrets/DB_PASS:DB_PASS"
#    allows custom env var names and full secret resource names
# If both provided, SECRET_MAP takes precedence.
###############################################################################

# Helper: fetch a single secret value by name (short name or full resource)
fetch_secret() {
  local secret_resource="$1"
  local sm_url
  # If resource looks like a full resource (contains /), use as-is, else build
  if [[ "$secret_resource" == *"/"* ]]; then
    sm_url="https://secretmanager.googleapis.com/v1/${secret_resource}/versions/latest:access"
  else
    sm_url="https://secretmanager.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/secrets/${secret_resource}/versions/latest:access"
  fi

  local resp
  resp=$(curl -fsS -H "Authorization: Bearer ${TOKEN}" "$sm_url" || true)
  if [ -z "$resp" ]; then
    return 1
  fi
  local payload_b64
  payload_b64=$(echo "$resp" | extract_json_field data)
  if [ -z "$payload_b64" ]; then
    return 2
  fi
  echo "$payload_b64" | b64_decode
}

# Process SECRET_MAP first (higher priority)
if [ -n "${SECRET_MAP:-}" ]; then
  IFS=',' read -ra MAP_PAIRS <<<"${SECRET_MAP}"
  for pair in "${MAP_PAIRS[@]}"; do
    # split on first colon
    secret_name="${pair%%:*}"
    env_name="${pair#*:}"
    if [ -z "$secret_name" ] || [ -z "$env_name" ]; then
      log "Skipping invalid SECRET_MAP pair: $pair"
      continue
    fi
    log "Fetching secret for mapping: $secret_name -> $env_name"
    val=$(fetch_secret "$secret_name") || {
      log "Failed to fetch secret $secret_name"
      exit 1
    }
    export "$env_name"="$val"
  done
elif [ -n "${SECRET_NAMES:-}" ]; then
  IFS=',' read -ra NAMES <<<"${SECRET_NAMES}"
  for name in "${NAMES[@]}"; do
    name_trimmed=$(echo "$name" | sed 's/^\s*//;s/\s*$//')
    if [ -z "$name_trimmed" ]; then
      continue
    fi
    log "Fetching secret: $name_trimmed"
    val=$(fetch_secret "$name_trimmed") || {
      log "Failed to fetch secret $name_trimmed"
      exit 1
    }
    export "$name_trimmed"="$val"
  done
else
  # Backwards compatible: if DISCORD_BOT_TOKEN env not set, fetch it
  if [ -z "${DISCORD_BOT_TOKEN:-}" ]; then
    log "Fetching DISCORD_BOT_TOKEN from Secret Manager..."
    DISCORD_BOT_TOKEN=$(fetch_secret "DISCORD_BOT_TOKEN") || {
      log "Failed to fetch DISCORD_BOT_TOKEN"
      exit 1
    }
    export DISCORD_BOT_TOKEN
  fi
fi

###############################################################################
# Pull image and run container
###############################################################################

log "Pulling image: ${IMAGE}"
for i in 1 2 3; do
  if docker pull "${IMAGE}"; then
    break
  fi
  log "docker pull failed, retry ${i}/3"
  sleep 1
  if [ "$i" = "3" ]; then
    log "Failed to pull image after retries"
    exit 1
  fi
done

log "Removing existing container (if any): ${CONTAINER_NAME}"
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

log "Starting container ${CONTAINER_NAME}"
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -e ENVIRONMENT="${ENVIRONMENT}" \
  -e CLOUD_RUN_API_SERVICE_URL="${CLOUD_RUN_API_SERVICE_URL}" \
  -e DISCORD_BOT_TOKEN="${DISCORD_BOT_TOKEN}" \
  "${IMAGE}"

###############################################################################
# Signal handling
###############################################################################

on_terminate() {
  log "Received termination signal, stopping container ${CONTAINER_NAME}"
  docker stop -t 30 "${CONTAINER_NAME}" || true
  exit 0
}
trap on_terminate SIGTERM SIGINT

###############################################################################
# Tail logs and keep process alive
###############################################################################

log "Tailing container logs for ${CONTAINER_NAME}"

docker logs -f "${CONTAINER_NAME}" &

# Keep the script running so the instance considers the startup script successful
while true; do
  sleep 60
done
