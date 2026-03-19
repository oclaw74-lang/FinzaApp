#!/bin/bash
set -e

BRANCH="${1:-testing}"

echo "=== Finza Deploy ==="
echo "Branch: $BRANCH"
echo ""

# Pull latest code
echo "Pulling latest code..."
git pull origin "$BRANCH"

# Rebuild and restart
echo "Rebuilding containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo ""
echo "=== Deploy complete! ==="
echo "App running at https://finza.online"
echo ""

# Show status
docker compose ps
