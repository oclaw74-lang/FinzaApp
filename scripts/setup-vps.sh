#!/bin/bash
# =============================================================================
# Finza — VPS initial setup script
# Run ONCE on a fresh Ubuntu server as root or sudo user
#
# Usage:
#   chmod +x setup-vps.sh
#   sudo ./setup-vps.sh
# =============================================================================

set -euo pipefail

REPO_URL="https://github.com/oclaw74-lang/FinzaApp.git"
APP_DIR="/opt/finza"
APP_USER="finza"

# ------------------------------------------------------------
# Colors
# ------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[setup]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $1"; }
fail() { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ------------------------------------------------------------
# 0. Must run as root
# ------------------------------------------------------------
[[ $EUID -ne 0 ]] && fail "Run this script as root: sudo ./setup-vps.sh"

# ------------------------------------------------------------
# 1. System update
# ------------------------------------------------------------
log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# ------------------------------------------------------------
# 2. Install dependencies
# ------------------------------------------------------------
log "Installing base dependencies..."
apt-get install -y -qq \
    git \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban

# ------------------------------------------------------------
# 3. Install Docker
# ------------------------------------------------------------
if command -v docker &>/dev/null; then
    warn "Docker already installed: $(docker --version)"
else
    log "Installing Docker..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    log "Docker installed: $(docker --version)"
fi

# ------------------------------------------------------------
# 4. Install certbot (snap)
# ------------------------------------------------------------
if command -v certbot &>/dev/null; then
    warn "certbot already installed: $(certbot --version)"
else
    log "Installing certbot via snap..."
    apt-get install -y -qq snapd
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
    log "certbot installed: $(certbot --version)"
fi

# ------------------------------------------------------------
# 5. Create app user (non-root)
# ------------------------------------------------------------
if id "$APP_USER" &>/dev/null; then
    warn "User $APP_USER already exists"
else
    log "Creating user $APP_USER..."
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG docker "$APP_USER"
fi

# ------------------------------------------------------------
# 6. Clone repository
# ------------------------------------------------------------
if [[ -d "$APP_DIR/.git" ]]; then
    warn "Repository already cloned at $APP_DIR"
else
    log "Cloning repository..."
    # If you need a GitHub token for a private repo, run:
    #   git clone https://<TOKEN>@github.com/oclaw74-lang/FinzaApp.git $APP_DIR
    # For a public repo:
    git clone "$REPO_URL" "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    log "Cloned to $APP_DIR"
fi

# ------------------------------------------------------------
# 7. Create .env.production from example
# ------------------------------------------------------------
if [[ -f "$APP_DIR/.env.production" ]]; then
    warn ".env.production already exists — skipping copy"
else
    log "Creating .env.production from template..."
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env.production"
    chown "$APP_USER:$APP_USER" "$APP_DIR/.env.production"
    chmod 600 "$APP_DIR/.env.production"
    warn "IMPORTANT: Edit $APP_DIR/.env.production and fill in all values before deploying."
fi

# ------------------------------------------------------------
# 8. Configure UFW firewall
# ------------------------------------------------------------
log "Configuring firewall (ufw)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw --force enable
log "Firewall rules applied:"
ufw status verbose

# ------------------------------------------------------------
# 9. Enable fail2ban
# ------------------------------------------------------------
log "Enabling fail2ban..."
systemctl enable --now fail2ban

# ------------------------------------------------------------
# 10. Install systemd service for auto-start on reboot
# ------------------------------------------------------------
log "Installing finza systemd service..."

cat > /etc/systemd/system/finza.service <<EOF
[Unit]
Description=Finza App (docker-compose production)
Documentation=https://github.com/oclaw74-lang/FinzaApp
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
User=${APP_USER}
Group=${APP_USER}
# Pull latest images / rebuild if needed at each boot is intentionally
# omitted here — deploy.sh handles that. This unit just brings up
# whatever images were last built.
ExecStart=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.production.yml \
    --env-file ${APP_DIR}/.env.production up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.production.yml \
    --env-file ${APP_DIR}/.env.production down
ExecReload=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.production.yml \
    --env-file ${APP_DIR}/.env.production restart
# Wait up to 3 minutes for containers to become healthy
TimeoutStartSec=180
TimeoutStopSec=60
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable finza.service
log "finza.service installed and enabled (starts automatically on reboot)"
log "Manual controls: systemctl start|stop|restart|status finza"

# ------------------------------------------------------------
# Done
# ------------------------------------------------------------
echo ""
log "======================================================"
log "VPS setup complete."
log "Next steps:"
log "  1. Edit $APP_DIR/.env.production with real values"
log "  2. Point your domain DNS A record to this server IP"
log "  3. Run: sudo $APP_DIR/scripts/setup-ssl.sh <your-domain>"
log "  4. Run: sudo -u $APP_USER $APP_DIR/scripts/deploy.sh"
log "  (After first deploy, finza.service will auto-start on reboot)"
log "======================================================"
