#!/bin/bash
# =============================================================================
# Finza — Deploy script
# Run each time you want to update the production environment.
#
# Usage:
#   ./deploy.sh [branch]   (default branch: main)
# =============================================================================

set -euo pipefail

APP_DIR="/opt/finza"
COMPOSE_FILE="$APP_DIR/docker-compose.production.yml"
ENV_FILE="$APP_DIR/.env.production"
BRANCH="${1:-main}"
HEALTH_URL="http://localhost/api/v1/health"
HEALTH_RETRIES=10
HEALTH_SLEEP=5

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${GREEN}[deploy]${NC} $1"; }
warn()    { echo -e "${YELLOW}[warn]${NC}   $1"; }
fail()    { echo -e "${RED}[error]${NC}  $1"; exit 1; }
section() { echo -e "\n${BLUE}==== $1 ====${NC}"; }

# ------------------------------------------------------------
# 0. Pre-flight checks
# ------------------------------------------------------------
section "Pre-flight"

[[ -d "$APP_DIR/.git" ]] || fail "App directory not found: $APP_DIR. Run setup-vps.sh first."
[[ -f "$ENV_FILE" ]]     || fail ".env.production not found. Copy from .env.production.example and fill values."

# Verify .env.production has no empty required values
for VAR in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY JWT_SECRET CORS_ORIGINS VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY VITE_API_URL; do
    VALUE=$(grep "^${VAR}=" "$ENV_FILE" | cut -d'=' -f2-)
    [[ -z "$VALUE" ]] && fail "$VAR is empty in .env.production. Fill it before deploying."
done

log "Pre-flight checks passed"

# ------------------------------------------------------------
# 1. Pull latest code
# ------------------------------------------------------------
section "Git pull"

cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
log "On branch $BRANCH — $(git rev-parse --short HEAD)"

# ------------------------------------------------------------
# 2. Build images
# ------------------------------------------------------------
section "Docker build"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
log "Images built"

# ------------------------------------------------------------
# 3. Start containers
# ------------------------------------------------------------
section "Start containers"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
log "Containers started"

# ------------------------------------------------------------
# 4. Health check
# ------------------------------------------------------------
section "Health check"

log "Waiting for backend health endpoint..."
for i in $(seq 1 $HEALTH_RETRIES); do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        log "Health check passed (attempt $i)"
        break
    fi
    if [[ $i -eq $HEALTH_RETRIES ]]; then
        warn "Health check failed after $HEALTH_RETRIES attempts"
        warn "Showing last 50 lines of backend logs:"
        docker compose -f "$COMPOSE_FILE" logs --tail=50 backend
        fail "Deploy aborted — backend is not healthy"
    fi
    warn "Attempt $i/$HEALTH_RETRIES failed — waiting ${HEALTH_SLEEP}s..."
    sleep "$HEALTH_SLEEP"
done

# ------------------------------------------------------------
# 5. Prune old images
# ------------------------------------------------------------
section "Cleanup"

docker system prune -f --filter "until=24h"
log "Old images pruned"

# ------------------------------------------------------------
# Done
# ------------------------------------------------------------
echo ""
log "======================================================"
log "Deploy complete"
log "Commit: $(git rev-parse --short HEAD)"
log "Branch: $BRANCH"
log "URL:    ${CORS_ORIGINS:-check CORS_ORIGINS in .env.production}"
log "======================================================"
