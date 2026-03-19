#!/bin/bash
# init-letsencrypt.sh — Obtain first SSL certificate from Let's Encrypt
#
# Run this ONCE on the VPS before starting the production stack.
# Usage: bash scripts/init-letsencrypt.sh
#
# Requires: docker compose v2, .env file with DOMAIN and EMAIL variables

set -e

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# Load .env
if [ ! -f .env ]; then
  echo "ERROR: .env file not found."
  echo "Copy .env.production.example to .env and fill in the values."
  exit 1
fi
source .env

DOMAIN="${DOMAIN:-finza.online}"
EMAIL="${EMAIL:-admin@finza.online}"

echo "=== Finza SSL Setup ==="
echo "Domain : $DOMAIN"
echo "Email  : $EMAIL"
echo ""

# Create required directories
mkdir -p "data/certbot/conf/live/$DOMAIN"
mkdir -p "data/certbot/www"

# Check if real cert already exists
if [ -f "data/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
  echo "Certificate already exists for $DOMAIN. Skipping..."
  echo "To renew manually: $COMPOSE run --rm certbot renew"
  exit 0
fi

# Create dummy certs so nginx can start (ssl_certificate is required in nginx.prod.conf)
echo "Creating temporary self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "data/certbot/conf/live/$DOMAIN/privkey.pem" \
  -out    "data/certbot/conf/live/$DOMAIN/fullchain.pem" \
  -subj   "/CN=localhost" 2>/dev/null

# Start nginx with production overlay (needs dummy certs to load ssl config)
echo "Starting nginx (HTTP mode for ACME challenge)..."
$COMPOSE up -d nginx
sleep 5

# Obtain real certificate from Let's Encrypt
echo "Obtaining SSL certificate from Let's Encrypt..."
$COMPOSE run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo ""
echo "=== Certificate obtained successfully! ==="
echo ""

# Reload nginx with real certificates
echo "Reloading nginx with real certificates..."
$COMPOSE exec nginx nginx -s reload

echo ""
echo "Now start the full production stack:"
echo "  $COMPOSE up -d --build"