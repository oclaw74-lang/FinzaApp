# Architecture

## Overview

Finza uses a three-tier architecture: React frontend, FastAPI backend, and Supabase (PostgreSQL) database. All communication happens over HTTPS/HTTP with JWT authentication.

```
Browser
  └── Nginx (port 80/443)
        ├── /api/* → FastAPI backend (port 8000)
        └── /* → React frontend (port 3000)
```

---

## Infrastructure

### Docker Compose Services

| Container | Image | Ports | Role |
|-----------|-------|-------|------|
| `finza-backend` | Custom (Python 3.11) | 8000 | FastAPI API server |
| `finza-frontend` | Custom (Node 20) | 3000 | Vite dev server / SPA |
| `finza-nginx` | nginx:1.25-alpine | 80, 443 | Reverse proxy |

All containers share the `finza-network` bridge network. Nginx depends on both services being healthy before starting.

---

## Backend Architecture

### Layers

```
HTTP Request
  └── FastAPI Router (app/api/v1/routes/*.py)
        └── Service Layer (app/services/*.py)
              └── Supabase Client (app/core/supabase_client.py)
                    └── Supabase PostgREST API
```

**Router** — validates request, extracts JWT from `Authorization: Bearer <token>`, delegates to service.

**Service** — all business logic lives here. No business logic in routes. Each service receives the raw user JWT to build a user-scoped Supabase client.

**Supabase client** — two client modes:
- `get_user_client(jwt)` — RLS enforced, data scoped to authenticated user
- `get_admin_client()` — service role, bypasses RLS (admin ops and public catalog reads)

### Authentication

```
Frontend → Supabase Auth → JWT (ECC P-256)
Frontend → FastAPI with Bearer token
FastAPI → PyJWT verify via JWKS
FastAPI → get_user_client(token) → RLS enforced in Supabase
```

JWT verification uses JWKS (not a shared secret). The token is verified by `app/core/auth.py` using `get_current_user()` as a FastAPI dependency.

### Route Modules (22 total)

| Module | Prefix | Description |
|--------|--------|-------------|
| `health` | `/api/v1/health` | Liveness check |
| `catalogos` | `/api/v1/catalogos` | Currencies, countries, banks |
| `categorias` | `/api/v1/categorias` | Expense/income categories |
| `ingresos` | `/api/v1/ingresos` | Income records |
| `egresos` | `/api/v1/egresos` | Expense records |
| `dashboard` | `/api/v1/dashboard` | Aggregated dashboard stats |
| `prestamos` | `/api/v1/prestamos` | Loans (given and received) |
| `metas` | `/api/v1/metas` | Savings goals |
| `presupuestos` | `/api/v1/presupuestos` | Monthly budgets |
| `tarjetas` | `/api/v1/tarjetas` | Credit/debit cards |
| `recurrentes` | `/api/v1/recurrentes` | Recurring transactions |
| `score` | `/api/v1/score` | Financial health score |
| `prediccion` | `/api/v1/prediccion` | Monthly expense prediction |
| `notificaciones` | `/api/v1/notificaciones` | In-app notifications |
| `fondo_emergencia` | `/api/v1/fondo-emergencia` | Emergency fund |
| `impulso` | `/api/v1/impulso` | Impulse purchase tracker |
| `suscripciones` | `/api/v1/suscripciones` | Subscriptions |
| `retos` | `/api/v1/retos` | Financial challenges |
| `educacion` | `/api/v1/educacion` | Financial education |
| `comparativa` | `/api/v1/comparativa` | Period comparisons |
| `profiles` | `/api/v1/profiles` | User profile / onboarding |

---

## Frontend Architecture

### State Management

| Concern | Tool |
|---------|------|
| Auth state (user, session) | Zustand (`useAuthStore`) |
| Server data (CRUD) | React Query (`useQuery`, `useMutation`) |
| Form state | React Hook Form + Zod |
| UI state (modals, tabs) | Local `useState` |

### Data Fetching Pattern

Each domain has a custom hook in `src/hooks/`:

```typescript
// Example: useIngresos
export function useIngresos(filters?: IngresosFilters) {
  return useQuery({
    queryKey: ['ingresos', filters],
    queryFn: () => api.get('/ingresos', { params: filters }),
  })
}
```

Catalog data (currencies, countries, banks) uses `staleTime: Infinity` since it rarely changes.

### Routing

React Router v6 with protected routes via `PrivateRoute` component. Public routes: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`.

### i18n

`react-i18next` with two locales: `es.ts` and `en.ts`. Language detected from browser, stored in `localStorage`.

### Component Structure

```
src/
├── pages/              # Route-level components
├── components/
│   ├── shared/         # Layout, Sidebar, StatsBar, etc.
│   └── [feature]/      # Feature-specific components
├── features/           # Complex feature modules (tarjetas, etc.)
└── hooks/              # React Query + domain hooks
```

---

## Database Architecture

Supabase (PostgreSQL) with Row Level Security (RLS) enforced on all user data tables.

### RLS Pattern

Every user-data table has:
```sql
ALTER TABLE public.tablename ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own data" ON public.tablename
  USING (auth.uid() = user_id);
```

Catalog tables (monedas, paises, bancos) have public read:
```sql
CREATE POLICY "public read" ON public.tablename FOR SELECT USING (true);
```

### Key Design Decisions

- **No SQLAlchemy** — removed in favor of direct supabase-py PostgREST calls. Simpler, leverages Supabase's realtime and RLS natively.
- **No Alembic** — migrations managed by Supabase CLI (`supabase db push`).
- **Service role for admin** — catalog reads and any cross-user admin operations use `get_admin_client()`.
- **JWT leeway** — 60-second clock drift tolerance for edge cases.

---

## Security

- All user data filtered by `auth.uid()` at the database layer (RLS)
- JWT verified server-side before any data access
- CORS configured explicitly via `CORS_ORIGINS` env var
- No hardcoded secrets — all via environment variables
- Service role key never exposed to frontend
