# Docker Deployment Guide

## Overview

PeopleFlow HR Suite uses production-grade Docker images with security hardening and optimization patterns inspired by the terminal-control repository.

## Key Features

### Security Hardening

- **Docker Hardened Images (DHI)** - Zero known CVEs, SLSA Build Level 3
- **Non-root execution** - All containers run as non-root users (UID 1001 or nginx user)
- **Read-only filesystem** - Application containers have read-only root filesystems
- **Dropped capabilities** - Only essential Linux capabilities are enabled
- **Resource limits** - Memory limits prevent resource exhaustion

### Build Optimization

- **Turbo prune** - Minimal build context for faster layer caching
- **BuildKit cache mounts** - Persistent caching across builds
- **Server bundling** - Bun bundler reduces server image to ~200MB
- **Multi-stage builds** - Separate stages for dependencies, building, and running

### Images

- **Server**: `dhi.io/bun:1-alpine3.22` - Bundled server (~200MB)
- **Web**: `nginx:1.27-alpine` - Static React app with nginx
- **Database**: `dhi.io/postgres:16-alpine3.22` - DHI hardened PostgreSQL

## Prerequisites

1. **Docker** 20.10+ with BuildX
2. **Docker Compose** 2.x
3. **Docker Hub Account** (free) - Required for DHI authentication

### DHI Authentication Setup

Docker Hardened Images require authentication (free, no subscription):

1. Sign into [hub.docker.com](https://hub.docker.com) with Google/GitHub
2. Go to **Account Settings → Personal access tokens**
3. Generate a new token with read permissions
4. Login to DHI registry:

```bash
docker login dhi.io -u YOUR_DOCKERHUB_USERNAME -p YOUR_GENERATED_TOKEN
```

## Quick Start

1. **Copy environment file**:
```bash
cp .env.docker.example .env.docker
```

2. **Update secrets** in `.env.docker`:
```bash
# Generate secure password
openssl rand -base64 32

# Update these in .env.docker:
POSTGRES_PASSWORD=your-secure-password-here
BETTER_AUTH_SECRET=your-secure-secret-here
BETTER_AUTH_URL=http://localhost
CORS_ORIGIN=http://localhost
```

3. **Deploy**:
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Build Docker images with DHI base images
- Start all services (PostgreSQL, server, web, nginx)
- Run database migrations automatically
- Display service status and access URLs

## Manual Deployment

### Build Images

```bash
docker compose build
```

### Start Services

```bash
docker compose up -d
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f server
docker compose logs -f web
docker compose logs -f postgres
```

### Stop Services

```bash
docker compose down
```

### Remove All Data

```bash
docker compose down -v
```

## Architecture

### Service Ports

| Service | Internal Port | External Port | Description |
|---------|---------------|---------------|-------------|
| PostgreSQL | 5432 | 5432 | Database |
| Server | 3000 | 3000 | API server |
| Web | 8080 | 8080 | Frontend app |
| Nginx | 80, 443 | 80, 443 | Reverse proxy |

### Network Flow

```
User → Nginx (Port 80/443)
        ↓
        ├→ Web (Port 8080) - Static React app
        └→ Server (Port 3000) - API endpoints
                    ↓
                PostgreSQL (Port 5432)
```

### Volume Mounts

- `postgres_data` - PostgreSQL data directory
- `./backups` - Database backup files

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` check every 10s
- **Server**: HTTP GET `/health` every 30s
- **Web**: HTTP GET on root path every 30s
- **Nginx**: HTTP GET on root path every 30s

## Security Features

### Read-Only Filesystem

Server and web containers have read-only root filesystems with writable tmpfs mounts:

```yaml
read_only: true
tmpfs:
  - /tmp:rw,noexec,nosuid,size=100m
```

### Capabilities

Containers drop all capabilities and only add essential ones:

```yaml
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE  # Bind to port 80/443
```

### Non-Root Users

- Server: UID 1001
- Web: nginx user
- PostgreSQL: postgres user

## CI/CD

GitHub Actions workflow (`.github/workflows/docker-build.yml`) builds and pushes images to GitHub Container Registry.

### Required Secrets

- `DHI_USERNAME` - Docker Hub username
- `DHI_PASSWORD` - Docker Hub personal access token
- `TURBO_TOKEN` - (Optional) Vercel Turborepo token for faster builds

### Build Caching

Multi-layer caching strategy:
1. **GitHub Actions cache** (10GB limit, fastest)
2. **Registry cache** (unlimited, cross-workflow sharing)

Expected build times:
- Cold build: ~5-8 minutes
- Cached build: ~1-2 minutes
- Fully cached: ~30 seconds

## Troubleshooting

### Database Connection Errors

Check PostgreSQL is healthy:
```bash
docker compose exec postgres pg_isready -U peopleflow
```

View database logs:
```bash
docker compose logs postgres
```

### Migration Failures

Migrations run automatically on server startup. Check server logs:
```bash
docker compose logs server | grep -i migration
```

### Build Failures

Ensure DHI authentication is working:
```bash
docker login dhi.io
```

Use verbose build output:
```bash
docker compose build --progress=plain
```

### Permission Errors

If you get permission errors with read-only filesystem, check tmpfs mounts are configured correctly.

## Production Deployment

For production:

1. **Use HTTPS** - Configure SSL certificates in `nginx/ssl/`
2. **Update URLs** - Set production URLs in `.env.docker`
3. **Secure secrets** - Use strong random passwords and secrets
4. **Resource limits** - Adjust memory limits based on load
5. **Backup strategy** - Configure automated backups
6. **Monitoring** - Add Sentry DSN for error tracking

## References

- [Docker Hardened Images](https://docs.docker.com/dhi/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Distroless containers](https://github.com/GoogleContainerTools/distroless)
- [Security best practices](https://docs.docker.com/develop/security-best-practices/)
