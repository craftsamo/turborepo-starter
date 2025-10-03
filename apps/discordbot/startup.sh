#!/bin/bash
set -euo pipefail

# Startup script for Discord bot on GCE
# This file is a template: the workflow runs `envsubst` to substitute
# variables such as IMAGE, REGION, ENVIRONMENT, CLOUD_RUN_API_SERVICE_URL.

echo "[$(date --iso-8601=seconds)] startup.sh: begin"

# Expected template variables (provided by envsubst):
#   IMAGE, REGION, ENVIRONMENT, CLOUD_RUN_API_SERVICE_URL, GOOGLE_CLOUD_PROJECT_ID

: "${IMAGE:?IMAGE must be set by envsubst}"
: "${REGION:?REGION must be set by envsubst}"
: "${ENVIRONMENT:?ENVIRONMENT must be set by envsubst}"
: "${GOOGLE_CLOUD_PROJECT_ID:?GOOGLE_CLOUD_PROJECT_ID must be set by envsubst}"

CONTAINER_NAME="discordbot"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Retrieving access token from metadata server..."
TOKEN_JSON=$(curl -s -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" || true)
if [ -z "$TOKEN_JSON" ]; then
  log "Failed to contact metadata server to retrieve token"
  exit 1
fi

# Extract access_token without requiring jq (use python if available, else fallback to shell parsing)
if command -v python3 >/dev/null 2>&1; then
  ACCESS_TOKEN=$(printf '%s' "$TOKEN_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token',''))")
else
  ACCESS_TOKEN=$(printf '%s' "$TOKEN_JSON" | sed -n 's/.*"access_token" *: *"\([^\"]*\)".*/\1/p')
fi

if [ -z "$ACCESS_TOKEN" ]; then
  log "Failed to extract access token"
  exit 1
fi

log "Logging in to Artifact Registry: ${REGION}-docker.pkg.dev"
printf '%s' "$ACCESS_TOKEN" | docker login -u oauth2accesstoken --password-stdin "${REGION}-docker.pkg.dev" >/dev/null 2>&1 || {
  log "Docker login failed"
  exit 1
}

log "Pulling image: ${IMAGE}"
docker pull "${IMAGE}" || {
  log "Failed to pull image ${IMAGE}"
  exit 1
}

# Generic secret fetcher: accepts SECRET_NAME and ENV_VAR_NAME
fetch_secret_to_envfile() {
  local secret_name="$1" env_var="$2"

  log "Fetching secret ${secret_name}"
  local secret_url="https://secretmanager.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/secrets/${secret_name}/versions/latest:access"
  local secret_json
  secret_json=$(curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" -H "Accept: application/json" "${secret_url}" || true)
  if [ -z "$secret_json" ]; then
    log "Failed to fetch secret ${secret_name} from Secret Manager"
    return 1
  fi

  local secret_value
  if command -v python3 >/dev/null 2>&1; then
    secret_value=$(printf '%s' "$secret_json" | python3 -c "import sys,json,base64; j=json.load(sys.stdin); print(base64.b64decode(j['payload']['data']).decode())")
  else
    local data_b64
    data_b64=$(printf '%s' "$secret_json" | sed -n 's/.*"data" *: *"\([^\"]*\)".*/\1/p')
    if [ -z "$data_b64" ]; then
      log "Failed to parse secret payload for ${secret_name}"
      return 1
    fi
    if printf '%s' "$data_b64" | base64 --decode >/dev/null 2>&1; then
      secret_value=$(printf '%s' "$data_b64" | base64 --decode)
    elif printf '%s' "$data_b64" | base64 -d >/dev/null 2>&1; then
      secret_value=$(printf '%s' "$data_b64" | base64 -d)
    elif printf '%s' "$data_b64" | base64 -D >/dev/null 2>&1; then
      secret_value=$(printf '%s' "$data_b64" | base64 -D)
    else
      log "No suitable base64 decode available on this system for ${secret_name}"
      return 1
    fi
  fi

  if [ -z "${secret_value:-}" ]; then
    log "Secret ${secret_name} is empty"
    return 1
  fi

  # Append to env file (will be used with --env-file)
  # Ensure env file exists with strict permissions
  printf '%s=%s\n' "$env_var" "$secret_value" >>"$SECRETS_ENV_FILE"
  return 0
}

# NOTE: Prepare secrets list. Format: SECRET_NAME:ENV_VAR_NAME,comma-separated
SECRETS=${SECRETS:-DISCORD_BOT_TOKEN:DISCORD_BOT_TOKEN}

# Prepare env file for docker --env-file
SECRETS_DIR="/run/discord"
SECRETS_ENV_FILE="$SECRETS_DIR/secrets.env"
mkdir -p "$SECRETS_DIR"
umask 077
: >"$SECRETS_ENV_FILE"
chmod 600 "$SECRETS_ENV_FILE"

# If SECRETS is non-empty, iterate and fetch
IFS=',' read -ra pairs <<<"$SECRETS"
for pair in "${pairs[@]}"; do
  # skip empty
  [ -z "$pair" ] && continue
  secret_name=${pair%%:*}
  env_var=${pair##*:}
  if [ -z "$secret_name" ] || [ -z "$env_var" ] || [ "$secret_name" = "$env_var" -a "$secret_name" = "" ]; then
    log "Invalid secret pair: $pair"
    exit 1
  fi
  if ! fetch_secret_to_envfile "$secret_name" "$env_var"; then
    log "Failed to fetch secret for $secret_name"
    exit 1
  fi
done

log "Stopping existing container (if any)"
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

# Run the container with sensible defaults. Use --env-file to pass secrets safely.
log "Starting container ${CONTAINER_NAME}"
docker run -d --restart unless-stopped \
  --name "${CONTAINER_NAME}" \
  --env-file "$SECRETS_ENV_FILE" \
  -e ENVIRONMENT="${ENVIRONMENT}" \
  -e CLOUD_RUN_API_SERVICE_URL="${CLOUD_RUN_API_SERVICE_URL:-}" \
  "${IMAGE}"

if [ $? -ne 0 ]; then
  log "Failed to start container"
  exit 1
fi

# Don't print secrets
log "startup.sh: finished"
exit 0
