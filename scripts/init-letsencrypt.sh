#!/bin/bash
set -e

# Load .env
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.production.example to .env and fill in values."
  exit 1
fi
source .env

DOMAIN="${DOMAIN:-finza.online}"
EMAIL="${EMAIL:-admin@finza.online}"

echo "=== Finza SSL Setup ==="
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# Create dirs
mkdir -p data/certbot/conf data/certbot/www

# Check if cert already exists
if [ -d "data/certbot/conf/live/$DOMAIN" ]; then
  echo "Certificate already exists for $DOMAIN. Skipping..."
  echo "To renew manually: docker compose run --rm certbot renew"
  exit 0
fi

# Start nginx in HTTP-only mode (for ACME challenge)
echo "Starting nginx for ACME challenge..."
docker compose up -d nginx

sleep 3

# Get the certificate
echo "Obtaining SSL certificate from Let's Encrypt..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo ""
echo "=== Certificate obtained successfully! ==="
echo ""
echo "Now restart the stack with production config:"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
