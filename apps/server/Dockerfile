# syntax=docker/dockerfile:1.7
# =============================================================================
# PeopleFlow HR Suite Server - Production Docker Image (Bundled)
# =============================================================================
# Production-optimized image using Bun bundler for minimal size (~200MB)
#
# Architecture:
#   - Stage 1 (Pruner): DHI Bun - Creates minimal build context using Turbo prune
#   - Stage 2 (Builder): DHI Bun - Installs deps, bundles server code with externals
#   - Stage 3 (Runner): DHI Bun Alpine - bundle + ONLY external packages
#
# DHI Strategy: "Build with DHI Dev, Ship with DHI Distroless"
#   - All stages use Docker Hardened Images for zero CVEs
#   - Build stages: dhi.io/bun:1-alpine3.22-dev (has shell for RUN commands)
#   - Runner stage: dhi.io/bun:1-alpine3.22 (minimal attack surface)
#
# Security:
#   - Docker Hardened Images (DHI) for ALL stages - zero known CVEs
#   - Non-root user execution (numeric UID 1001)
#   - Minimal attack surface with bundled dependencies
#   - SLSA Build Level 3 for supply chain security
#
# External packages (break when bundled due to dynamic code patterns):
#   - hono, @hono/* (web framework)
#   - @orpc/* (RPC framework)
#   - better-auth (auth library)
#   - drizzle-orm, postgres, pg (database)
#
# Build: docker build -t peopleflow-server:latest -f apps/server/Dockerfile .
# =============================================================================

# =============================================================================
# Stage 1: Prune (DHI Bun Dev - create minimal build context)
# =============================================================================
# Using DHI -dev variant which includes shell for RUN commands
FROM dhi.io/bun:1-alpine3.22-dev AS pruner
WORKDIR /app

# Disable Husky git hooks (no .git in Docker)
ENV HUSKY=0

# Copy entire monorepo and prune to server scope
COPY . .
RUN bunx turbo prune --scope=@PeopleFlow-HR-Suite/server --docker

# =============================================================================
# Stage 2: Builder (DHI Bun Dev - install deps + bundle)
# =============================================================================
# Using DHI -dev variant which includes shell for RUN commands
FROM dhi.io/bun:1-alpine3.22-dev AS builder
WORKDIR /app

# Disable Husky git hooks
ENV HUSKY=0

# Copy pruned lockfile and package.json files (better layer caching)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock

# Install dependencies with BuildKit cache mount
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build environment
ENV NODE_ENV=production

# Build the server (TypeScript compilation) with Turbo cache
RUN --mount=type=cache,target=/root/.cache/turbo \
    bunx turbo build --filter=@PeopleFlow-HR-Suite/server...

# Bundle server with problematic packages as externals
# These packages use dynamic imports/code that breaks when minified
RUN mkdir -p dist && \
    bun build apps/server/src/index.ts \
    --target=bun \
    --outdir=dist \
    --entry-naming=server.bundled.js \
    --minify \
    --external hono \
    --external '@hono/*' \
    --external '@orpc/*' \
    --external better-auth \
    --external drizzle-orm \
    --external postgres \
    --external pg

# Bundle migration script separately
RUN bun build packages/db/scripts/migrate.ts \
    --target=bun \
    --outdir=dist \
    --entry-naming=migrate.bundled.js \
    --external drizzle-orm \
    --external postgres \
    --external pg

# Create minimal node_modules with only external packages
RUN mkdir -p /app/externals && \
    cd /app/externals && \
    echo '{"name":"externals","type":"module"}' > package.json && \
    bun add hono@^4 better-auth drizzle-orm postgres pg @orpc/server @orpc/client @orpc/openapi @orpc/zod @hono/node-server --production

# =============================================================================
# Stage 3: Production Runner (DHI Bun Alpine)
# =============================================================================
# Using Docker Hardened Images (DHI) for enhanced security
# DHI Bun Alpine: Zero known CVEs, includes glibc compatibility for Bun runtime
# See: https://docs.docker.com/dhi/
FROM dhi.io/bun:1-alpine3.22 AS runner
WORKDIR /app

# OCI Labels
LABEL org.opencontainers.image.title="PeopleFlow HR Suite Server" \
      org.opencontainers.image.description="PeopleFlow HR Suite API Server" \
      org.opencontainers.image.vendor="PeopleFlow HR Suite" \
      maintainer="PeopleFlow Team"

# Copy bundled server (no source maps in production for smaller size)
# Use numeric UID:GID (1001:1001) since distroless has no user database
COPY --from=builder --chown=1001:1001 /app/dist/server.bundled.js ./server.bundled.js

# Copy bundled migration script
COPY --from=builder --chown=1001:1001 /app/dist/migrate.bundled.js ./migrate.bundled.js

# Copy ONLY external packages (not full node_modules)
COPY --from=builder --chown=1001:1001 /app/externals/node_modules ./node_modules

# Copy migration files (needed by drizzle migrator)
COPY --from=builder --chown=1001:1001 /app/packages/db/src/migrations ./packages/db/src/migrations

# Copy JavaScript entrypoint (replaces shell script for distroless compatibility)
COPY --chown=1001:1001 apps/server/docker-entrypoint.js /app/docker-entrypoint.js

# Copy health check script (for exec-form HEALTHCHECK in shell-less containers)
COPY --chown=1001:1001 apps/server/healthcheck.js /app/healthcheck.js

# Run as non-root user (numeric UID for distroless compatibility)
USER 1001

# Environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

EXPOSE 3000

# Health check using Bun exec form (no shell in DHI image)
# Uses dedicated script instead of inline code for reliable exec-form parsing
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD ["bun", "run", "/app/healthcheck.js"]

# Use Bun to run the JavaScript entrypoint (no shell in distroless)
ENTRYPOINT ["bun", "run", "/app/docker-entrypoint.js"]
