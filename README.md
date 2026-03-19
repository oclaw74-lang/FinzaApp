# Finza — Personal Finance App

Finza is a full-stack personal finance web application built with FastAPI, React, and Supabase. It helps users track income, expenses, credit cards, savings goals, budgets, loans, and more — with multi-currency support, dark mode, and i18n (ES/EN).

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 · FastAPI 0.109 · supabase-py 2.7.4 · Pydantic v2 · PyJWT |
| Frontend | React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS v3.4 · Zustand · React Query · Zod · React Hook Form |
| Database | Supabase (PostgreSQL) — cloud hosted, RLS enforced |
| Auth | Supabase Auth — ECC P-256 JWT via JWKS |
| Infrastructure | Docker Compose (3 containers) · Nginx reverse proxy |

---

## Features

- **Dashboard** — income/expense summary, top categories, recent activity, monthly comparison
- **Income & Expenses** — CRUD with categories, dates, notes, and multi-currency support
- **Credit Cards** — visual card UI with network logos (Visa/MC/Amex/Discover), credit limit, available balance, bank selector from catalog
- **Savings Goals** — track progress toward financial goals with emoji icons
- **Budgets** — monthly budgets per category with usage progress
- **Loans** — track loans given and received with payment schedule and interest
- **Recurring** — recurring expenses/income with frequency tracking
- **Emergency Fund** — dedicated savings tracker for emergency reserves
- **Subscriptions** — track active subscriptions with billing cycles
- **Challenges** — gamified financial challenges with progress tracking
- **Financial Education** — curated lessons and tips
- **Impulse Control** — tool to evaluate and delay impulse purchases
- **Notifications** — in-app notification center
- **Score** — financial health score
- **Predictions** — monthly expense predictions
- **Comparative** — period-over-period comparisons
- **Multi-currency** — DOP, USD, EUR, MXN, COP, ARS, BRL, GBP, CAD, CLP, PEN
- **Multi-language** — Spanish and English
- **Dark mode** — full dark/light theme support

---

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Supabase project (cloud)
- Supabase CLI (for migrations)

### 1. Clone and configure

```bash
git clone https://github.com/oclaw74-lang/FinzaApp.git
cd FinzaApp
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost/api/v1
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2. Apply database migrations

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Via Nginx | http://localhost:80 |

---

## Project Structure

```
Finza/
├── backend/
│   ├── app/
│   │   ├── api/v1/routes/      # 22 route modules
│   │   ├── services/           # Business logic layer
│   │   ├── schemas/            # Pydantic v2 models
│   │   └── core/               # Config, Supabase client
│   ├── tests/                  # pytest test suite
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/              # 21 page components
│   │   ├── components/         # Shared + feature components
│   │   ├── hooks/              # React Query hooks
│   │   ├── store/              # Zustand stores
│   │   ├── i18n/               # ES/EN translations
│   │   └── types/              # TypeScript interfaces
│   └── Dockerfile
├── supabase/
│   └── migrations/             # 21 SQL migration files
├── nginx/
│   └── nginx.conf
├── docs/                       # Project documentation
└── docker-compose.yml
```

---

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full local setup instructions, testing, and contribution guidelines.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design, layers, and patterns.

## API Reference

See [docs/API.md](docs/API.md) for all REST endpoints.

## Database

See [docs/DATABASE.md](docs/DATABASE.md) for schema, tables, RLS policies, and migrations.

---

## Tests

```bash
# Backend
cd backend && pytest -v

# Frontend
cd frontend && npm run test -- --run

# E2E (requires containers running)
cd qa && npx playwright test
```

---

## Git Flow

```
feature/* → testing → main
```

- All feature branches target `testing`
- `main` is production-ready
- `staging` exists for pre-production validation

---

## License

Private — all rights reserved.
