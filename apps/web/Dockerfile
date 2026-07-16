###############################################################################
# Builder stage: Install dependencies and prune unnecessary files             #
###############################################################################
FROM node:24-alpine AS builder

# Update Alpine package manager and install libc6-compat for compatibility
RUN apk update && apk add --no-cache libc6-compat

# Set working directory in the container
WORKDIR /app

# Enable Corepack so the pinned pnpm (packageManager field) is used
RUN corepack enable

# Copy all files from the host to the container's working directory
COPY . .

# Prune unnecessary files and isolate the web subworkspace
RUN pnpm dlx turbo@2.9.14 prune --scope=web --docker

###############################################################################
# Installer stage: Add lockfile and package.json's of isolated subworkspace   #
###############################################################################
FROM node:24-alpine AS installer

# Set working directory in the container
WORKDIR /app

# Enable Corepack so the pinned pnpm version is used
RUN corepack enable

# Copy only the files `pnpm fetch` depends on: the lockfile, the workspace
# layout and the root package.json (Corepack reads its packageManager field).
# `turbo prune --docker` places pnpm-lock.yaml and pnpm-workspace.yaml in out/json.
COPY --from=builder /app/out/json/package.json /app/out/json/pnpm-lock.yaml /app/out/json/pnpm-workspace.yaml ./

# Populate the pnpm store from the lockfile alone, so this layer stays cached
# as long as pnpm-lock.yaml is unchanged (e.g. across version bumps and
# package.json script edits).
RUN pnpm fetch

# Copy the pruned package.json files of the isolated subworkspace
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/turbo.json ./turbo.json

# Install dependencies from the pre-populated store, without network access
# (dev deps included; required by the build stage)
RUN pnpm install --frozen-lockfile --offline

###############################################################################
# Sourcer stage: Build the application                                        #
###############################################################################
FROM node:24-alpine AS sourcer

# Enable Corepack so the pinned pnpm version is used
RUN corepack enable

# Set working directory in the container
WORKDIR /app

# Copy installed dependencies and pruned files from installer and builder stages
COPY --from=installer /app/ .
COPY --from=builder /app/out/full/ .

# Build the application using turbo
RUN pnpm exec turbo run build --filter=web...

###############################################################################
# Runner stage: Prepare lightweight runtime for the application               #
###############################################################################
FROM node:24-alpine as runner

# Set working directory in the container
WORKDIR /app

# Copy runtime dependencies and built application files from previous stages
COPY --from=installer /app/node_modules ./node_modules
COPY --from=sourcer /app/apps/web/.next ./apps/web/.next
COPY --from=sourcer /app/apps/web/package.json ./apps/web/package.json
COPY --from=sourcer /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=sourcer /app/apps/web/public ./apps/web/public

# Set working directory to the web application directory
WORKDIR /app/apps/web/

# Define environment variables for the application
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Start the web application
CMD [ "npm", "start" ]
