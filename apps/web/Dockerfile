# syntax=docker/dockerfile:1.7
# =============================================================================
# PeopleFlow HR Suite Web - Production Docker Image
# =============================================================================
# Multi-stage build optimized for:
#   - Speed: Turbo prune for minimal build context + BuildKit cache mounts
#   - Security: Docker Hardened Images (DHI) for build stages
#   - Size: Minimal production image with static output + nginx
#
# DHI Strategy: "Build with DHI Dev, Ship with Nginx Alpine"
#   - Build stages: dhi.io/bun:1-alpine3.22-dev (has shell for RUN commands)
#   - Runner stage: nginx:alpine (static file serving)
#
# Build: docker build -t peopleflow-web:latest -f apps/web/Dockerfile .
# =============================================================================

# =============================================================================
# Stage 1: Prune (DHI Bun Dev - create minimal build context)
# =============================================================================
# Using turbo prune to create minimal build context (only web and its dependencies)
# This significantly improves layer caching as lockfile changes are isolated
FROM dhi.io/bun:1-alpine3.22-dev AS pruner
WORKDIR /app

# Disable Husky git hooks (no .git in Docker)
ENV HUSKY=0

# Copy entire monorepo and prune to web scope
COPY . .
RUN bunx turbo prune --scope=@PeopleFlow-HR-Suite/web --docker

# =============================================================================
# Stage 2: Dependencies (DHI Bun Dev)
# =============================================================================
# Install dependencies from pruned lockfile for better layer caching
FROM dhi.io/bun:1-alpine3.22-dev AS deps
WORKDIR /app

# Disable Husky git hooks
ENV HUSKY=0

# Copy pruned lockfile and package.json files (better layer caching)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock

# Install dependencies with BuildKit cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

# =============================================================================
# Stage 3: Builder (DHI Bun Dev)
# =============================================================================
FROM dhi.io/bun:1-alpine3.22-dev AS builder
WORKDIR /app

# Build-time arguments for public environment variables
ARG VITE_API_URL
ARG VITE_BETTER_AUTH_URL

# Optional: Turborepo remote cache (pass these from CI)
ARG TURBO_TOKEN
ARG TURBO_TEAM

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:3000}
ENV VITE_BETTER_AUTH_URL=${VITE_BETTER_AUTH_URL:-http://localhost:3000}
ENV NODE_ENV=production
ENV CI=true
ENV HUSKY=0

# Set Turborepo remote cache if provided
ENV TURBO_TOKEN=${TURBO_TOKEN}
ENV TURBO_TEAM=${TURBO_TEAM}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build the Vite app with BuildKit cache for faster rebuilds
# Use Turborepo cache mount for incremental builds
RUN --mount=type=cache,target=/root/.cache/turbo \
    bunx turbo build --filter=@PeopleFlow-HR-Suite/web

# =============================================================================
# Stage 4: Runner (Nginx on Alpine)
# =============================================================================
# Using official Nginx Alpine image for static file serving
FROM nginx:1.27-alpine AS runner
WORKDIR /app

# OCI Labels
LABEL org.opencontainers.image.title="PeopleFlow HR Suite Web" \
      org.opencontainers.image.description="PeopleFlow HR Suite Web Application (React + Vite)" \
      org.opencontainers.image.vendor="PeopleFlow HR Suite" \
      maintainer="PeopleFlow Team"

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets
COPY --from=builder --chown=nginx:nginx /app/apps/web/dist /usr/share/nginx/html

# Security: Run as non-root user
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run \
    && chmod -R 755 /var/cache/nginx /var/log/nginx /var/run

USER nginx

# Expose port
EXPOSE 8080

# Health check using wget (available in alpine-based images)
# Use 127.0.0.1 to force IPv4
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
