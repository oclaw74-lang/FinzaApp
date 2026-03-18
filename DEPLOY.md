# Finza — VPS Deployment Guide

Server: Ubuntu VPS at 35.169.196.48
Stack: FastAPI backend + React/Vite frontend + nginx reverse proxy
SSL: Let's Encrypt via certbot
DB: Supabase cloud (no local DB)

---

## Prerequisites

- A domain purchased on GoDaddy (or any registrar)
- SSH access to the VPS as root or a sudo user
- GitHub token with `repo` read access (if the repo is private)
- All Supabase keys ready (URL, anon key, service role key, JWT secret)

---

## Step 1 — Configure DNS in GoDaddy

1. Log in to GoDaddy > Manage DNS for your domain.
2. Add or update the A record:

   | Type | Name | Value          | TTL  |
   |------|------|----------------|------|
   | A    | @    | 35.169.196.48  | 600  |
   | A    | www  | 35.169.196.48  | 600  |

3. DNS propagation can take 5–30 minutes. Verify with:

   ```bash
   dig +short your-domain.com
   # Should return: 35.169.196.48
   ```

---

## Step 2 — SSH into the VPS

```bash
ssh root@35.169.196.48
```

---

## Step 3 — Run the setup script (run once)

Upload the script or clone the repo manually first, then:

```bash
# Option A: clone and run
git clone https://github.com/oclaw74-lang/FinzaApp.git /tmp/finza-setup
chmod +x /tmp/finza-setup/scripts/setup-vps.sh
sudo /tmp/finza-setup/scripts/setup-vps.sh
```

This script:
- Installs Docker, Docker Compose v2, certbot, git, ufw, fail2ban
- Creates a `finza` system user (non-root, added to the `docker` group)
- Clones the repo to `/opt/finza`
- Creates `/opt/finza/.env.production` from the example template
- Opens ports 22, 80, 443 in the firewall
- Installs and enables a `finza.service` systemd unit so the app starts automatically on server reboot

---

## Step 4 — Edit .env.production

```bash
nano /opt/finza/.env.production
```

Fill in every variable:

```
SUPABASE_URL=https://omhfdzcrusahvvzoljpf.supabase.co
SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
JWT_SECRET=<from Supabase dashboard, Settings > API > JWT Secret>
ENVIRONMENT=production
CORS_ORIGINS=https://your-domain.com
VITE_SUPABASE_URL=https://omhfdzcrusahvvzoljpf.supabase.co
VITE_SUPABASE_ANON_KEY=<same as SUPABASE_ANON_KEY>
VITE_API_URL=https://your-domain.com/api/v1
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## Step 5 — Obtain SSL certificate

DNS must be propagated before running this step.

```bash
chmod +x /opt/finza/scripts/setup-ssl.sh
sudo /opt/finza/scripts/setup-ssl.sh your-domain.com admin@your-domain.com
```

This script:
- Obtains a Let's Encrypt certificate for `your-domain.com` and `www.your-domain.com`
- Replaces the `DOMINIO` placeholder in `nginx/nginx.production.conf`
- Configures a daily cron job for auto-renewal

---

## Step 6 — Deploy

```bash
chmod +x /opt/finza/scripts/deploy.sh
sudo -u finza /opt/finza/scripts/deploy.sh main
```

The deploy script:
1. Validates that `.env.production` has no empty required values
2. Pulls latest code from the specified branch
3. Builds Docker images from scratch (`--no-cache`)
4. Starts all containers
5. Runs a health check against `http://localhost/api/v1/health`
6. Prunes old Docker images

---

## Step 7 — Verify

```bash
# Backend health
curl https://your-domain.com/api/v1/health

# HTTPS redirect
curl -I http://your-domain.com

# Container status
docker compose -f /opt/finza/docker-compose.production.yml ps

# Logs
docker compose -f /opt/finza/docker-compose.production.yml logs -f
```

---

## Updating the application

For every new deployment after the initial setup:

```bash
sudo -u finza /opt/finza/scripts/deploy.sh main
```

Or to deploy from a specific branch:

```bash
sudo -u finza /opt/finza/scripts/deploy.sh testing
```

---

## Rollback

To revert to a previous commit:

```bash
cd /opt/finza
git log --oneline -10          # find the commit hash to roll back to
git checkout <commit-hash>
sudo -u finza /opt/finza/scripts/deploy.sh
```

To rollback without rebuilding (instant, uses last built image):

```bash
cd /opt/finza
docker compose -f docker-compose.production.yml --env-file .env.production down
git checkout <commit-hash>
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

---

## Renewing SSL manually

Certbot auto-renews via cron, but you can force it:

```bash
sudo certbot renew --force-renewal
docker exec finza-nginx nginx -s reload
```

---

## Systemd service controls

After setup, `finza.service` manages the app as a systemd unit:

```bash
# Status
systemctl status finza

# Start / stop / restart
sudo systemctl start finza
sudo systemctl stop finza
sudo systemctl restart finza

# View service logs (combines all containers)
journalctl -u finza -f

# Disable auto-start (if needed)
sudo systemctl disable finza
```

The service is of type `oneshot` with `RemainAfterExit=yes`. It calls
`docker compose up -d` on start and `docker compose down` on stop.

---

## File locations on the VPS

| Path                                       | Purpose                                |
|--------------------------------------------|----------------------------------------|
| `/opt/finza/`                              | Application root                       |
| `/opt/finza/.env.production`               | Production secrets (chmod 600)         |
| `/opt/finza/docker-compose.production.yml` | Production compose config              |
| `/opt/finza/nginx/nginx.production.conf`   | nginx config (DOMINIO replaced by SSL script) |
| `/opt/finza/scripts/setup-vps.sh`          | Initial server setup (run once)        |
| `/opt/finza/scripts/setup-ssl.sh`          | Certbot certificate setup (run once)   |
| `/opt/finza/scripts/deploy.sh`             | Subsequent deploys                     |
| `/etc/systemd/system/finza.service`        | systemd unit for auto-start on reboot  |
| `/etc/letsencrypt/live/<domain>/`          | SSL certificates                       |
| `/var/log/nginx/`                          | nginx access and error logs            |

---

## Hardening SSH (recommended)

After verifying you can log in with your SSH key, disable password authentication:

```bash
# On the VPS
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sudo systemctl reload sshd
```

Do not close your current session until you confirm you can open a new SSH connection successfully.

---

## Security checklist

- [ ] `.env.production` permissions are 600 (`stat /opt/finza/.env.production`)
- [ ] No secrets in any Dockerfile or committed file (`git log --all --full-diff -- '*.env'`)
- [ ] UFW firewall allows only 22, 80, 443 (`ufw status verbose`)
- [ ] fail2ban active (`systemctl status fail2ban`)
- [ ] SSH password authentication disabled (`sshd -T | grep passwordauth`)
- [ ] `finza.service` enabled (`systemctl is-enabled finza`)
- [ ] Auto-renewal cron present (`crontab -l | grep certbot`)
- [ ] HSTS header confirmed (`curl -I https://your-domain.com | grep Strict`)
- [ ] Containers not running as root (`docker exec finza-backend id`)
