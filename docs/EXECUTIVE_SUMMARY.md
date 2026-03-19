# Executive Summary — Finza

> **"Fluye hacia tu libertad financiera"**

---

## What is Finza?

Finza is a personal finance management web application designed for Spanish-speaking users in Latin America and Spain. It provides a comprehensive suite of tools to help individuals take control of their financial life: tracking income and expenses, managing credit cards, setting savings goals, creating monthly budgets, and monitoring loans.

## Target Users

Individuals aged 22–45 in Latin American and Caribbean markets (initial focus: Dominican Republic) who want a modern, mobile-friendly app to replace spreadsheets and manage their personal finances in their local currency.

## Business Value

- **Multi-currency support** — Users in 11 countries can track finances in DOP, USD, EUR, MXN, COP, ARS, BRL, GBP, CAD, CLP, PEN
- **Financial education** — Built-in lessons and challenges to improve financial literacy
- **Behavioral nudges** — Impulse purchase tracker, financial score, spending predictions
- **Complete picture** — Cards, loans, subscriptions, recurring expenses, emergency fund all in one place

---

## Technical Overview

### Architecture

Three-tier architecture deployed via Docker Compose:

```
Browser → Nginx → FastAPI (backend) + React (frontend)
                      ↓
                  Supabase (PostgreSQL + Auth)
```

### Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 / FastAPI 0.109 |
| Data access | supabase-py 2.7.4 (PostgREST over HTTPS — no SQLAlchemy) |
| Schema validation | Pydantic v2 |
| Frontend | React 18 / TypeScript / Vite 5 / Tailwind CSS v3.4 |
| State | Zustand + React Query + Zod + React Hook Form |
| Database | Supabase cloud (PostgreSQL with RLS) |
| Auth | Supabase Auth (ECC P-256 JWT via JWKS) |
| Infrastructure | Docker Compose (3 containers) + Nginx |
| CI/CD | GitHub Actions |
| Migrations | Supabase CLI (`supabase db push`) |

### Key Design Decisions

- **Supabase over raw PostgreSQL** — Leverages built-in auth, realtime, and Row Level Security. No SQLAlchemy or Alembic needed.
- **PostgREST via supabase-py** — Clean query builder without raw SQL in application code
- **Pydantic v2** — Schema validation and serialization with excellent performance
- **React Query** — Server state management with caching, optimistic updates, and automatic refetching
- **i18n from day one** — Full Spanish/English support via react-i18next

---

## Feature Matrix

| Feature | Status |
|---------|--------|
| Authentication (login/register/forgot/reset) | ✅ |
| Dashboard with monthly stats | ✅ |
| Income & expense tracking | ✅ |
| Credit/debit card management with network logos | ✅ |
| Savings goals with emoji icons | ✅ |
| Monthly budgets per category | ✅ |
| Loan tracking (given and received) | ✅ |
| Recurring transactions | ✅ |
| Emergency fund tracker | ✅ |
| Subscriptions manager | ✅ |
| Financial challenges (gamification) | ✅ |
| Financial education lessons | ✅ |
| Impulse purchase tracker | ✅ |
| Financial health score | ✅ |
| Spending predictions | ✅ |
| Period comparisons | ✅ |
| Bank catalog (46 banks, 11 countries) | ✅ |
| Multi-currency (11 currencies, ISO 4217) | ✅ |
| Dark mode | ✅ |
| Spanish / English i18n | ✅ |
| Notifications center | ✅ |

---

## Brand Identity

### Colors
```
Finza Blue (Primary):     #366092
Flow Light (Secondary):   #5B9BD5
Prosperity Green (Win):   #00B050
Golden Flow (Accent):     #FFC000
Alert Red (Error):        #FF0000
Flow Light Input:         #D9E1F2
```

### Typography
- **UI text:** Inter (sans-serif)
- **Numbers/amounts:** JetBrains Mono (monospace)

---

## Development Status

- **MVP:** Complete — all core financial features implemented and tested
- **Test coverage:** 200+ pytest tests, 200+ vitest tests, E2E Playwright suite
- **Deployment:** Docker Compose for local dev; VPS production and staging configs ready
- **Branch flow:** `feature/* → testing → main`

---

## Repository

- **GitHub:** `oclaw74-lang/FinzaApp` (private)
- **Docs:** See [`docs/`](.) for architecture, API reference, database schema, and development guide
