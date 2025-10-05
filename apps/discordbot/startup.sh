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
# Artifact Registry authentication
###############################################################################

metadata_ready_wait

log "Obtaining metadata token..."
TOKEN=$(get_metadata_token) || {
  log "ERROR: Failed to get metadata token"
  exit 1
}

DEFAULT_REGISTRY="${REGION}-docker.pkg.dev"
IMAGE_REGISTRY="${IMAGE%%/*}"
if [[ "$IMAGE_REGISTRY" == *".pkg.dev" ]]; then
  REGISTRY_HOST="$IMAGE_REGISTRY"
else
  REGISTRY_HOST="$DEFAULT_REGISTRY"
fi
REGISTRY_URL="https://${REGISTRY_HOST}"

log "Logging into Artifact Registry ($REGISTRY_URL)..."
for i in $(seq 1 3); do
  if printf '%s' "$TOKEN" | docker login -u oauth2accesstoken --password-stdin "$REGISTRY_URL"; then
    log "Docker login succeeded"
    break
  else
    log "Docker login failed (attempt $i/3) — refreshing token"
    TOKEN=$(get_metadata_token) || log "WARN: token refresh failed (attempt $i)"
  fi
  sleep 2
  if [ "$i" -eq 3 ]; then
    log "ERROR: Docker login failed after 3 attempts"
    exit 1
  fi
done

###############################################################################
# Secret Manager
###############################################################################

fetch_secret() {
  local secret_ref="$1" env_name="$2"
  local sm_url
  if [[ "$secret_ref" == *"/"* ]]; then
    sm_url="https://secretmanager.googleapis.com/v1/${secret_ref}/versions/latest:access"
  else
    sm_url="https://secretmanager.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/secrets/${secret_ref}/versions/latest:access"
  fi
  log "Fetching secret $secret_ref"
  local resp=$(curl -fsS -H "Authorization: Bearer ${TOKEN}" "$sm_url" || true)
  local data_b64=$(echo "$resp" | extract_json_field data)
  if [ -z "$data_b64" ]; then
    log "ERROR: Secret $secret_ref missing data"
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
# Pull & run container
###############################################################################

log "Pulling image $IMAGE"
for i in $(seq 1 3); do
  docker pull "$IMAGE" && break || log "docker pull failed ($i/3)"
  sleep 2
  [ "$i" -eq 3 ] && {
    log "ERROR: image pull failed"
    exit 1
  }
done

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

log "Starting container $CONTAINER_NAME"
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -e ENVIRONMENT="$ENVIRONMENT" \
  -e CLOUD_RUN_API_SERVICE_URL="$CLOUD_RUN_API_SERVICE_URL" \
  -e DISCORD_BOT_TOKEN="${DISCORD_BOT_TOKEN:-}" \
  "$IMAGE"

trap 'log "Termination signal, stopping container"; docker stop -t 30 "$CONTAINER_NAME" || true; exit 0' SIGTERM SIGINT

log "Streaming logs from $CONTAINER_NAME"
docker logs -f "$CONTAINER_NAME" &
while true; do sleep 60; done
