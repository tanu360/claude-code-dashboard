#!/bin/bash

echo "🚀 Claude Code Dashboard Deployment"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker compose is installed (v2 or v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start the dashboard
echo "🔨 Building and starting the dashboard..."
$DOCKER_COMPOSE up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Dashboard deployed successfully!"
    echo "📊 Access your dashboard at: http://localhost:3300"
    echo ""
    echo "💡 Useful commands:"
    echo "   - View logs: $DOCKER_COMPOSE logs -f"
    echo "   - Stop dashboard: $DOCKER_COMPOSE down"
    echo "   - Restart dashboard: $DOCKER_COMPOSE restart"
else
    echo "❌ Deployment failed. Check the logs with: $DOCKER_COMPOSE logs"
    exit 1
fi
