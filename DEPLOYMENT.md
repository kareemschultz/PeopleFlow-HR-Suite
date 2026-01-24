# Deployment Guide

This guide covers deploying PeopleFlow HR Suite to production.

## Prerequisites ✅

- [x] Database: PostgreSQL 14+
- [x] Node.js runtime: Bun 1.2+
- [x] Domain name configured
- [x] SSL certificate (Let's Encrypt recommended)

## Deployment Options 🚀

### Option 1: Vercel (Recommended for Quick Start)

**Pros:**
- Zero configuration
- Automatic HTTPS
- Global CDN
- Preview deployments
- Free tier available

**Steps:**
1. **Install Vercel CLI:**
   ```bash
   bun add -g vercel
   ```

2. **Configure Environment Variables:**
   Create `.env.production` in `apps/web`:
   ```bash
   VITE_API_URL=https://api.your-domain.com
   VITE_BETTER_AUTH_URL=https://api.your-domain.com/api/auth
   ```

   Create `.env.production` in `apps/server`:
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/db
   BETTER_AUTH_SECRET=your-secret-key
   BETTER_AUTH_URL=https://api.your-domain.com/api/auth
   CORS_ORIGIN=https://your-domain.com
   ```

3. **Deploy:**
   ```bash
   # Deploy web app
   cd apps/web
   vercel --prod

   # Deploy server
   cd apps/server
   vercel --prod
   ```

4. **Configure Database:**
   - Use Vercel Postgres or external provider
   - Run migrations: `bun run db:push`

---

### Option 2: Docker + VPS (Self-Hosted)

**Pros:**
- Full control
- Cost-effective for large scale
- No vendor lock-in

**Docker Compose Setup:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: peopleflow
      POSTGRES_USER: peopleflow
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    environment:
      DATABASE_URL: postgresql://peopleflow:${DB_PASSWORD}@db:5432/peopleflow
      BETTER_AUTH_SECRET: ${AUTH_SECRET}
      BETTER_AUTH_URL: https://api.your-domain.com/api/auth
      CORS_ORIGIN: https://your-domain.com
    ports:
      - "3000:3000"
    depends_on:
      - db

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      VITE_API_URL: https://api.your-domain.com
      VITE_BETTER_AUTH_URL: https://api.your-domain.com/api/auth
    ports:
      - "5173:80"
    depends_on:
      - server

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - server

volumes:
  postgres_data:
```

**Server Dockerfile:**

```dockerfile
# apps/server/Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY apps/server/package.json ./apps/server/
COPY packages ./packages
RUN bun install --frozen-lockfile

# Build
COPY apps/server ./apps/server
RUN cd apps/server && bun run build

# Production stage
FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=base /app/apps/server/dist ./dist
COPY --from=base /app/node_modules ./node_modules

EXPOSE 3000
CMD ["bun", "run", "dist/index.mjs"]
```

**Web Dockerfile:**

```dockerfile
# apps/web/Dockerfile
FROM oven/bun:1 AS build
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/
COPY packages ./packages
RUN bun install --frozen-lockfile

# Build
COPY apps/web ./apps/web
RUN cd apps/web && bun run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Deploy:**
```bash
# Set environment variables
export DB_PASSWORD=your-db-password
export AUTH_SECRET=your-auth-secret

# Start services
docker-compose up -d

# Run migrations
docker-compose exec server bun run db:push

# Check logs
docker-compose logs -f
```

---

### Option 3: Railway

**Pros:**
- Easy deployment
- Built-in database
- Automatic scaling
- Developer-friendly

**Steps:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Create project: `railway init`
4. Add PostgreSQL: `railway add --database postgresql`
5. Deploy: `railway up`

---

### Option 4: Fly.io

**Pros:**
- Global edge deployment
- Run close to users
- PostgreSQL included

**Steps:**
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Deploy: `fly deploy`

---

## CI/CD Automation 🤖

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: '1.2.18'

      - name: Install dependencies
        run: bun install

      - name: Type check
        run: bun run check-types

      - name: Lint
        run: bun x ultracite check

      - name: Test
        run: bun run test:run

      - name: Build
        run: bun run build

  deploy-server:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_SERVER_PROJECT_ID }}
          working-directory: ./apps/server

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_WEB_PROJECT_ID }}
          working-directory: ./apps/web
```

**Required Secrets:**
- `VERCEL_TOKEN`: Get from Vercel dashboard
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_SERVER_PROJECT_ID`: Server project ID
- `VERCEL_WEB_PROJECT_ID`: Web project ID

---

## Database Migrations 🗄️

### Production Migration Workflow

```bash
# 1. Generate migration SQL
bun run db:generate

# 2. Review migration files
cat packages/db/drizzle/*.sql

# 3. Apply to production (with backup!)
# Option A: Using Drizzle
bun run db:migrate

# Option B: Manual SQL execution
psql $DATABASE_URL < packages/db/drizzle/0001_migration.sql
```

**Best Practices:**
- Always backup before migrations
- Test migrations on staging first
- Use transactions for rollback safety
- Monitor query performance after deployment

---

## Environment Variables 🔐

### Required Variables

**Server (.env.production):**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
BETTER_AUTH_SECRET=<64-char random string>
BETTER_AUTH_URL=https://api.your-domain.com/api/auth

# CORS
CORS_ORIGIN=https://your-domain.com

# Optional: Email (if using email auth)
EMAIL_FROM=noreply@your-domain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key
```

**Web (.env.production):**
```bash
VITE_API_URL=https://api.your-domain.com
VITE_BETTER_AUTH_URL=https://api.your-domain.com/api/auth
```

### Generating Secrets

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -hex 32
```

---

## Post-Deployment Checklist ✅

### Immediate Steps

- [ ] Run database migrations
- [ ] Seed initial data (if needed)
- [ ] Create first admin user
- [ ] Verify authentication works
- [ ] Test critical user flows
- [ ] Check error logging
- [ ] Monitor performance metrics

### DNS Configuration

```
# A Records
your-domain.com         → <web-app-ip>
api.your-domain.com     → <server-ip>

# CNAME (if using Vercel)
your-domain.com         → cname.vercel-dns.com
api.your-domain.com     → cname.vercel-dns.com
```

### SSL/HTTPS

**Option A: Let's Encrypt (Free)**
```bash
certbot certonly --standalone -d your-domain.com -d api.your-domain.com
```

**Option B: Cloudflare (Recommended)**
- Automatic SSL
- DDoS protection
- Global CDN
- Free plan available

---

## Monitoring & Logging 📊

### Recommended Services

**Error Tracking:**
- Sentry (recommended)
- Rollbar
- Bugsnag

**Performance Monitoring:**
- Vercel Analytics
- New Relic
- Datadog

**Uptime Monitoring:**
- UptimeRobot (free)
- Pingdom
- StatusCake

### Setup Example (Sentry)

```typescript
// apps/server/src/index.ts
import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Backup Strategy 💾

### Database Backups

**Automated Daily Backups:**
```bash
# Cron job (daily at 2 AM)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

**Retention Policy:**
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

**Backup Verification:**
```bash
# Test restore on staging
gunzip < backup.sql.gz | psql $STAGING_DATABASE_URL
```

---

## Scaling Considerations 📈

### Horizontal Scaling

**Database:**
- Read replicas for reporting queries
- Connection pooling (PgBouncer)
- Partitioning for large tables

**Server:**
- Load balancer (nginx, HAProxy)
- Multiple server instances
- Session storage (Redis)

**Web:**
- CDN for static assets
- Edge caching
- Service workers for offline support

### Performance Targets

- **API Response Time:** < 200ms (p95)
- **Database Queries:** < 50ms (p95)
- **Page Load Time:** < 2s (LCP)
- **Uptime:** 99.9% (8.76 hours downtime/year)

---

## Troubleshooting 🔧

### Common Issues

**Database Connection Errors:**
```bash
# Check connection
psql $DATABASE_URL

# Verify SSL mode
DATABASE_URL=postgresql://...?sslmode=require
```

**Build Failures:**
```bash
# Clear cache
rm -rf node_modules apps/*/node_modules
bun install

# Type check
bun run check-types
```

**CORS Errors:**
- Verify `CORS_ORIGIN` matches your web app domain
- Check for trailing slashes
- Ensure cookies are allowed (credentials: true)

---

**Last Updated:** 2026-01-23
**Next Review:** After first production deployment
**Support:** Check SECURITY.md for incident response
