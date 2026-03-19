# 🚀 Guía de Deploy — Finza

## Estructura de branches

```
testing  →  staging  →  main
   ↓           ↓          ↓
  dev      pre-prod   producción
                     (auto-deploy)
```

**Flujo de trabajo:**
1. Desarrollas en `testing`
2. Cuando está listo, merge a `staging` para probar en pre-producción
3. Cuando está validado, merge a `main` → GitHub Actions despliega automáticamente al VPS

---

## Prerequisitos

- [ ] VPS con Ubuntu 22.04
- [ ] Acceso SSH al VPS (como root o usuario con sudo)
- [ ] Dominios apuntando al VPS (`finza.online`, `www.finza.online`)
- [ ] Credenciales de Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY, JWT_SECRET)

---

## PASO 1 — Configurar DNS

En tu proveedor de dominios, agrega estos registros A:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | `finza.online` | `IP_DE_TU_VPS` | 300 |
| A | `www.finza.online` | `IP_DE_TU_VPS` | 300 |
| A | `finza.digital` | `IP_DE_TU_VPS` | 300 |

> ⏳ La propagación DNS tarda entre 5 y 30 minutos. Verifica con:
> ```bash
> nslookup finza.online
> # Debe responder con la IP de tu VPS
> ```

---

## PASO 2 — Preparar el VPS (solo una vez)

Conéctate al VPS:
```bash
ssh root@IP_DE_TU_VPS
```

### 2.1 Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verificar
docker --version
docker compose version
```

### 2.2 Clonar el repositorio

```bash
git clone https://github.com/oclaw74-lang/FinzaApp.git /opt/finza
cd /opt/finza
git checkout main
```

### 2.3 Configurar variables de entorno

```bash
cp .env.production.example .env
nano .env
```

Valores obligatorios a llenar:

```env
DOMAIN=finza.online
EMAIL=tu@email.com

SUPABASE_URL=https://XXXX.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=tu-jwt-secret

VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://finza.online/api/v1
```

### 2.4 Dar permisos a los scripts

```bash
chmod +x scripts/init-letsencrypt.sh
chmod +x scripts/deploy.sh
```

---

## PASO 3 — Obtener certificado SSL (solo una vez)

> ⚠️ El DNS debe estar propagado antes de este paso.

```bash
cd /opt/finza
./scripts/init-letsencrypt.sh
```

Este script:
1. Crea los directorios para certbot
2. Levanta nginx temporalmente en HTTP
3. Obtiene el certificado de Let's Encrypt para `finza.online` y `www.finza.online`
4. El certificado se renueva automáticamente cada 12h

---

## PASO 4 — Primer deploy

```bash
cd /opt/finza
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Verificar que todo está corriendo:

```bash
docker compose ps
# Deben aparecer: finza-backend, finza-frontend, finza-nginx, finza-certbot

curl https://finza.online/api/v1/health
# Respuesta esperada: {"status":"ok","environment":"production"}
```

---

## PASO 5 — Configurar GitHub Actions (auto-deploy desde main)

### 5.1 Crear SSH key dedicada para deployments

En el VPS:

```bash
# Generar key pair
ssh-keygen -t ed25519 -C "github-actions-finza" -f ~/.ssh/finza_deploy -N ""

# Agregar la clave pública al VPS
cat ~/.ssh/finza_deploy.pub >> ~/.ssh/authorized_keys

# Mostrar la clave privada (la copiarás a GitHub en el siguiente paso)
cat ~/.ssh/finza_deploy
```

### 5.2 Agregar Secrets en GitHub

Ve a tu repositorio en GitHub → **Settings → Secrets and variables → Actions → New repository secret**

Agrega estos 3 secrets:

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP de tu VPS (ej: `123.45.67.89`) |
| `VPS_USER` | Usuario SSH (ej: `root`) |
| `VPS_SSH_KEY` | Contenido completo del archivo `~/.ssh/finza_deploy` (clave privada) |

### 5.3 El workflow ya está configurado

El archivo `.github/workflows/deploy.yml` ya está en el repositorio y se activa automáticamente cuando haces push a `main`.

**Flujo automático:**

```
git push origin main
        ↓
GitHub Actions detecta el push
        ↓
Se conecta al VPS por SSH
        ↓
git pull origin main
        ↓
docker compose up -d --build
        ↓
✅ App actualizada en https://finza.online
```

---

## PASO 6 — Configurar Supabase para producción

En el dashboard de Supabase (supabase.com → tu proyecto):

1. **Authentication → URL Configuration**
   - **Site URL**: `https://finza.online`

2. **Authentication → URL Configuration → Redirect URLs**
   - Agregar: `https://finza.online/**`

> Si usas un proyecto Supabase separado para producción, corre las migraciones:
> ```bash
> supabase db push --db-url "postgresql://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres"
> ```

---

## Flujo de trabajo diario (desarrollo → producción)

```
1. Desarrollar en rama feature/xxx
2. Merge a testing  → probar localmente
3. Merge a staging  → probar en pre-producción
4. Merge a main     → GitHub Actions despliega automáticamente
```

### Merge a staging

```bash
git checkout staging
git merge testing
git push origin staging
```

### Merge a main (dispara el deploy automático)

```bash
git checkout main
git merge staging
git push origin main
# ← GitHub Actions se activa aquí automáticamente
```

---

## Comandos útiles en el VPS

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose logs -f

# Solo el backend
docker compose logs -f backend

# Solo nginx
docker compose logs -f nginx
```

### Estado de los contenedores

```bash
docker compose ps
```

### Reiniciar un servicio

```bash
docker compose restart backend
docker compose restart nginx
```

### Deploy manual (sin GitHub Actions)

```bash
cd /opt/finza
./scripts/deploy.sh
```

---

## Rollback — revertir a versión anterior

```bash
cd /opt/finza

# Ver commits recientes
git log --oneline -10

# Volver a un commit específico
git checkout <COMMIT_HASH> -- .

# Reconstruir con esa versión
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Para volver al estado más reciente
git checkout main
```

---

## Renovación SSL

El certificado se renueva automáticamente cada 12h gracias al contenedor `certbot`. No necesitas hacer nada manualmente.

Para verificar el estado del certificado:

```bash
docker compose run --rm certbot certificates
```

Para forzar la renovación:

```bash
docker compose run --rm certbot renew --force-renewal
docker compose restart nginx
```

---

## Resolución de problemas

### La app no carga después del deploy

```bash
docker compose ps
docker compose logs --tail=50 backend
docker compose logs --tail=50 nginx
```

### Error de certificado SSL

```bash
# Verificar que los archivos del cert existen
ls data/certbot/conf/live/finza.online/

# Si no existen, volver a correr:
./scripts/init-letsencrypt.sh
```

### Puerto 80/443 bloqueado

```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp   # ← NO olvidar SSH
```

### GitHub Actions falla en "Deploy via SSH"

1. Verificar que `VPS_HOST`, `VPS_USER` y `VPS_SSH_KEY` están bien configurados en GitHub Secrets
2. Verificar que la clave pública está en `~/.ssh/authorized_keys` en el VPS
3. Verificar que el directorio `/opt/finza` existe en el VPS
