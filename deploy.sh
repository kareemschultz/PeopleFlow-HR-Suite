#!/bin/bash
set -e

echo "🚀 PeopleFlow HR Suite - Docker Deployment"
echo "=========================================="

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo "⚠️  .env.docker file not found. Creating from .env.docker.example..."
    if [ -f .env.docker.example ]; then
        cp .env.docker.example .env.docker
        echo "✅ Created .env.docker file. Please update it with your secrets before deploying!"
        echo ""
        echo "Required secrets:"
        echo "  1. POSTGRES_PASSWORD - Secure database password"
        echo "  2. BETTER_AUTH_SECRET - Random string (min 32 chars)"
        echo ""
        echo "Generate with: openssl rand -base64 32"
        echo ""
        exit 1
    else
        echo "❌ .env.docker.example not found. Cannot proceed."
        exit 1
    fi
fi

# Source environment variables
export $(cat .env.docker | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "changeme-to-secure-password" ]; then
    echo "❌ POSTGRES_PASSWORD not set or using default value!"
    echo "   Please update .env.docker with a secure password"
    exit 1
fi

if [ -z "$BETTER_AUTH_SECRET" ] || [ "$BETTER_AUTH_SECRET" = "changeme-to-secure-random-string-min-32-chars" ]; then
    echo "❌ BETTER_AUTH_SECRET not set or using default value!"
    echo "   Please update .env.docker with a secure secret"
    echo "   Generate with: openssl rand -base64 32"
    exit 1
fi

# Build images
echo "📦 Building Docker images (this may take a few minutes)..."
echo "   Using Docker Hardened Images (DHI) for enhanced security"
docker compose build --progress=plain

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Start services
echo "🚀 Starting services..."
docker compose up -d

# Wait for database to be healthy
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout 60 sh -c 'until docker compose exec postgres pg_isready -U ${POSTGRES_USER:-peopleflow}; do sleep 2; done' || {
    echo "❌ Database failed to start. Check logs with: docker compose logs postgres"
    exit 1
}

echo "✅ Database is ready"

# Migrations are handled automatically by server entrypoint
echo "📊 Server will run migrations on startup..."
sleep 3

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🌐 Access URLs:"
echo "   Web App:      http://localhost:${HTTP_PORT:-80}"
echo "   API:          http://localhost:${HTTP_PORT:-80}/rpc"
echo "   API Direct:   http://localhost:${API_PORT:-3000}"
echo ""
echo "📝 View logs:"
echo "   docker compose logs -f"
echo "   docker compose logs -f server    # Server logs only"
echo "   docker compose logs -f web       # Web logs only"
echo "   docker compose logs -f postgres  # Database logs only"
echo ""
echo "🛑 Stop services:"
echo "   docker compose down"
echo ""
echo "🗑️  Remove all data:"
echo "   docker compose down -v"
