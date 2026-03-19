# Development Guide

## Prerequisites

- **Docker Desktop** (v24+) with Docker Compose
- **Node.js 20+** (for running frontend tests locally without Docker)
- **Python 3.11+** (for running backend tests locally without Docker)
- **Supabase CLI** (for database migrations)
- **Git**

---

## Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/oclaw74-lang/FinzaApp.git
cd FinzaApp
```

### 2. Create environment file

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Backend
JWT_SECRET=your-jwt-secret
SUPABASE_URL=https://omhfdzcrusahvvzoljpf.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Frontend
VITE_SUPABASE_URL=https://omhfdzcrusahvvzoljpf.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost/api/v1
```

> The Supabase keys are available in your Supabase dashboard under Settings > API.

### 3. Apply database migrations

```bash
supabase login
supabase link --project-ref omhfdzcrusahvvzoljpf
supabase db push
```

### 4. Start services

```bash
docker-compose up --build
```

This builds and starts three containers:
- `finza-backend` — FastAPI at `http://localhost:8000`
- `finza-frontend` — React/Vite at `http://localhost:3000`
- `finza-nginx` — Nginx at `http://localhost:80`

---

## Daily Development

### Start

```bash
docker-compose up
```

Frontend uses Vite HMR — changes to `frontend/src/` are reflected instantly without restart.

Backend uses uvicorn with `--reload` in development mode — changes to `backend/app/` are reflected automatically.

### Stop

```bash
docker-compose down
```

### Rebuild after dependency changes

```bash
docker-compose build --no-cache
docker-compose up
```

---

## Backend Development

### Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── router.py          # Assembles all sub-routers
│   │   └── routes/            # One file per feature
│   ├── services/              # Business logic (no HTTP concerns)
│   ├── schemas/               # Pydantic v2 request/response models
│   └── core/
│       ├── config.py          # Settings from environment
│       ├── supabase_client.py # get_user_client / get_admin_client
│       └── auth.py            # JWT dependency (get_current_user)
├── tests/                     # pytest test suite
└── requirements.txt
```

### Adding a new endpoint

1. Create `backend/app/schemas/myfeature.py` with Pydantic models
2. Create `backend/app/services/myfeature.py` with business logic
3. Create `backend/app/api/v1/routes/myfeature.py` with FastAPI router
4. Register in `backend/app/api/v1/router.py`
5. Write tests in `backend/tests/test_myfeature.py`

### Supabase client pattern

```python
from app.core.supabase_client import get_user_client, get_admin_client
from app.core.auth import get_current_user

@router.get("/items")
def list_items(user=Depends(get_current_user)):
    client = get_user_client(user["jwt"])  # RLS enforced
    res = client.table("items").select("*").execute()
    return res.data

# For public catalog endpoints (no auth needed):
@router.get("/catalogo")
def get_catalog():
    client = get_admin_client()  # bypasses RLS
    res = client.table("catalog_table").select("*").execute()
    return res.data
```

---

## Frontend Development

### Structure

```
frontend/src/
├── pages/             # Route-level components (one per route)
├── components/
│   ├── shared/        # Layout, Sidebar, StatsBar, Navbar
│   └── [feature]/     # Domain-specific components
├── features/          # Complex multi-component features
├── hooks/             # React Query + domain hooks
├── store/             # Zustand global state
├── types/             # TypeScript interfaces
├── i18n/
│   └── locales/       # es.ts, en.ts translation files
└── lib/               # API client, utilities
```

### Adding a new page

1. Create `frontend/src/pages/MyPage.tsx`
2. Add route in `frontend/src/App.tsx`
3. Add sidebar entry in `frontend/src/components/shared/Sidebar.tsx`
4. Add i18n keys in `frontend/src/i18n/locales/es.ts` and `en.ts`
5. Add hook in `frontend/src/hooks/useMyFeature.ts`
6. Write tests in `frontend/src/pages/__tests__/MyPage.test.tsx`

### API hook pattern

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => api.get('/items').then(r => r.data),
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ItemCreate) => api.post('/items', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}
```

### Catalog hooks (public, no auth)

```typescript
import { useMonedas, usePaises, useBancos } from '@/hooks/useCatalogos'

const { data: monedas = [] } = useMonedas()
const { data: paises = [] } = usePaises()
const { data: bancos = [] } = useBancos('DO')  // country code
```

---

## Testing

### Backend (pytest)

```bash
# From project root
docker exec finza-backend pytest -v

# Or locally (requires Python 3.11 + deps installed)
cd backend
pip install -r requirements.txt
pytest -v

# Run specific test file
pytest tests/test_catalogos.py -v

# Run with coverage
pytest --cov=app --cov-report=term-missing
```

Backend tests use `unittest.mock.patch` to mock the Supabase client — no real DB connection needed.

### Frontend (Vitest)

```bash
# From project root
docker exec finza-frontend npm run test -- --run

# Or locally
cd frontend
npm install
npm run test -- --run

# Watch mode
npm run test

# With coverage
npm run test -- --run --coverage
```

### E2E (Playwright)

```bash
# Requires containers running
cd qa
npx playwright test

# Run specific suite
npx playwright test finza-e2e.spec.ts

# With UI
npx playwright test --ui
```

---

## Database Migrations

```bash
# Create a new migration
supabase migration new feature_name

# Apply all pending migrations
supabase db push

# Check migration status
supabase migration list
```

Migration files go in `supabase/migrations/YYYYMMDDHHMMSS_name.sql`.

**Do not use Alembic** — it was removed from this project. Use Supabase CLI only.

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (admin) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `ENVIRONMENT` | No | `development` (default) or `production` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_API_URL` | No | Backend API base URL (default: `http://localhost/api/v1`) |

---

## Git Workflow

```bash
# Always branch from testing
git checkout testing
git pull origin testing
git checkout -b feature/my-feature

# Work, commit, push
git add .
git commit -m "feat(scope): description"
git push origin feature/my-feature

# Open PR targeting testing (never main directly)
gh pr create --base testing --title "feat: ..." --body "..."
```

### Commit message format (Conventional Commits)

```
feat(scope): add something new
fix(scope): fix a bug
test(scope): add or update tests
refactor(scope): refactor without behavior change
chore: update dependencies
docs: update documentation
ci: update CI/CD config
```

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Push / PR to `testing` or `main` | Run pytest + vitest |
| `deploy-staging.yml` | Push to `staging` | Deploy to staging VPS |
| `deploy-production.yml` | Push to `main` | Deploy to production VPS |

CI runs:
1. Backend: `pytest` with Python 3.11
2. Frontend: `vitest --run` with Node 20 (deletes package-lock.json before install to avoid npm bug #4828 on Linux)
