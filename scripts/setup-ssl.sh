#!/bin/bash
# =============================================================================
# Finza — SSL certificate setup via Let's Encrypt (certbot)
# Run ONCE after DNS is pointed to this server and HTTP is reachable.
#
# Usage:
#   chmod +x setup-ssl.sh
#   sudo ./setup-ssl.sh your-domain.com
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[ssl]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
fail() { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ------------------------------------------------------------
# Args
# ------------------------------------------------------------
[[ $# -lt 1 ]] && fail "Usage: sudo ./setup-ssl.sh <domain> [email]"

DOMAIN="$1"
EMAIL="${2:-admin@${DOMAIN}}"
APP_DIR="/opt/finza"

# ------------------------------------------------------------
# 0. Root check
# ------------------------------------------------------------
[[ $EUID -ne 0 ]] && fail "Run as root: sudo ./setup-ssl.sh <domain>"

# ------------------------------------------------------------
# 1. Verify certbot is installed
# ------------------------------------------------------------
command -v certbot &>/dev/null || fail "certbot not found. Run setup-vps.sh first."

# ------------------------------------------------------------
# 2. Verify port 80 is reachable (containers must NOT be running yet
#    or nginx must not bind 80 so standalone can use it)
# ------------------------------------------------------------
log "Stopping any container using port 80 temporarily..."
docker stop finza-nginx 2>/dev/null || true

# ------------------------------------------------------------
# 3. Obtain certificate
# ------------------------------------------------------------
log "Obtaining certificate for $DOMAIN (email: $EMAIL)..."
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

log "Certificate obtained at /etc/letsencrypt/live/$DOMAIN/"

# ------------------------------------------------------------
# 4. Replace DOMINIO placeholder in nginx production config
# ------------------------------------------------------------
NGINX_CONF="$APP_DIR/nginx/nginx.production.conf"

if grep -q "DOMINIO" "$NGINX_CONF"; then
    log "Replacing DOMINIO placeholder in nginx.production.conf..."
    sed -i "s/DOMINIO/$DOMAIN/g" "$NGINX_CONF"
    log "nginx.production.conf updated with domain: $DOMAIN"
else
    warn "No DOMINIO placeholder found in nginx.production.conf — skipping replacement."
fi

# ------------------------------------------------------------
# 5. Configure auto-renewal via cron
# ------------------------------------------------------------
log "Configuring certbot auto-renewal cron..."
CRON_JOB="0 3 * * * certbot renew --quiet --deploy-hook 'docker exec finza-nginx nginx -s reload'"

# Add only if not already present
(crontab -l 2>/dev/null | grep -q "certbot renew") \
    && warn "Auto-renewal cron already configured" \
    || (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

log "Auto-renewal cron configured: runs daily at 03:00"

# ------------------------------------------------------------
# Done
# ------------------------------------------------------------
echo ""
log "======================================================"
log "SSL setup complete for $DOMAIN"
log "Next step: run deploy.sh"
log "  sudo -u finza $APP_DIR/scripts/deploy.sh"
log "======================================================"
