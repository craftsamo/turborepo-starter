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
SERVICE_ACCOUNT="${SERVICE_ACCOUNT}"
CLOUD_RUN_API_SERVICE_URL="${CLOUD_RUN_API_SERVICE_URL}"

: "${CONTAINER_NAME:?APP_NAME is required}"
: "${IMAGE:?IMAGE is required}"
: "${REGION:?REGION is required}"
: "${ENVIRONMENT:?ENVIRONMENT is required}"
: "${GOOGLE_CLOUD_PROJECT_ID:?GOOGLE_CLOUD_PROJECT_ID is required}"
: "${SERVICE_ACCOUNT:?SERVICE_ACCOUNT is required}"
: "${CLOUD_RUN_API_SERVICE_URL:?CLOUD_RUN_API_SERVICE_URL is required}"

###############################################################################
# Install gcloud CLI (Container-Optimized OS)
###############################################################################

install_gcloud() {
  log "Installing Google Cloud SDK..."

  # Check if gcloud is already installed
  if command -v gcloud >/dev/null 2>&1; then
    log "gcloud is already installed"
    return 0
  fi

  # Install gcloud CLI for Container-Optimized OS
  export CLOUDSDK_CORE_DISABLE_PROMPTS=1
  curl -sSL https://sdk.cloud.google.com | bash

  # Add to PATH
  export PATH="/root/google-cloud-sdk/bin:$PATH"

  # Initialize gcloud with the instance's service account
  gcloud config set account "${SERVICE_ACCOUNT}"
  gcloud config set project "${GOOGLE_CLOUD_PROJECT_ID}"

  log "gcloud installation completed"
}

# Install gcloud first
install_gcloud

###############################################################################
# Docker availability
###############################################################################

log "Checking docker availability..."
command -v docker >/dev/null 2>&1 || {
  log "ERROR: docker not found"
  exit 1
}

###############################################################################
# Artifact Registry authentication using gcloud
###############################################################################

DEFAULT_REGISTRY="${REGION}-docker.pkg.dev"
IMAGE_REGISTRY="${IMAGE%%/*}"
if [[ "$IMAGE_REGISTRY" == *".pkg.dev" ]]; then
  REGISTRY_HOST="$IMAGE_REGISTRY"
else
  REGISTRY_HOST="$DEFAULT_REGISTRY"
fi

log "Configuring Docker authentication for ${REGISTRY_HOST}..."

# Configure docker to use gcloud as credential helper
gcloud auth configure-docker "${REGISTRY_HOST}" --quiet

log "Docker authentication configured"

###############################################################################
# Secret Manager access using gcloud
###############################################################################

fetch_secret() {
  local secret_ref="$1" env_name="$2"

  log "Fetching secret $secret_ref using gcloud..."

  # Use gcloud to access the secret
  local value=$(gcloud secrets versions access latest --secret="$secret_ref" --project="${GOOGLE_CLOUD_PROJECT_ID}" 2>/dev/null || true)

  if [ -z "$value" ]; then
    log "ERROR: Failed to fetch secret $secret_ref"
    return 1
  fi

  export "$env_name"="$value"
  log "Secret $secret_ref loaded into $env_name"
}

# Fetch secrets
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
  if docker pull "$IMAGE" 2>&1 | tee /tmp/docker_pull.log; then
    log "Image pulled successfully"
    break
  else
    log "docker pull failed ($i/3)"
    cat /tmp/docker_pull.log
  fi
  sleep 2
  [ "$i" -eq 3 ] && {
    log "ERROR: image pull failed after 3 attempts"
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
