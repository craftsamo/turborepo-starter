###############################################################################
# Builder stage: Install dependencies and prune unnecessary files             #
###############################################################################
FROM node:20-alpine AS base

# Update apk package index and install libc6-compat for compatibility
RUN apk update && apk add --no-cache libc6-compat

###############################################################################
# Builder stage: Build the application                                        #
###############################################################################
FROM base AS builder

# Set the working directory for the build process
WORKDIR /app

# Install Turbo globally to manage the monorepo and build processes
RUN yarn global add turbo

# Copy all files from the current context to the container
COPY . .

# Prune unnecessary files and isolate the subworkspace for the API
RUN turbo prune --scope=api --docker

###############################################################################
# Installer stage: Add lockfile and package.json's of isolated subworkspace   #
###############################################################################
FROM base AS installer

# Set the working directory for the installation process
WORKDIR /app

# Copy pruned package.json files and lockfile from the builder stage
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
COPY --from=builder /app/turbo.json ./turbo.json

# Install dependencies for the isolated subworkspace
# RUN yarn install --frozen-lockfile --production=true
RUN yarn install --frozen-lockfile --production=false

# Copy the full workspace content for the API
COPY --from=builder /app/out/full/ .

# Build the API application using Turbo
RUN yarn turbo run build --filter=api...

###############################################################################
# Runner stage: Prepare lightweight runtime for the application               #
###############################################################################
FROM base AS runner

# Set the working directory for the runtime
WORKDIR /app

# Create a system group and user for running the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

# Switch to the created user
USER api

# Copy the application files from the installer stage with appropriate ownership
COPY --from=installer --chown=api:nodejs /app .

# Expose the application port
EXPOSE 5002

# Set environment variables for the application
ENV PORT=5002
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Command to start the application
CMD [ "node", "/app/apps/api/dist/main.js" ]
