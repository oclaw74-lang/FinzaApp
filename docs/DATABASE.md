# Database

Finza uses Supabase (PostgreSQL) with Row Level Security (RLS) enforced on all user data.

## Connection

- **Provider:** Supabase cloud
- **Project:** `omhfdzcrusahvvzoljpf`
- **Access:** Via PostgREST (HTTP) through `supabase-py` — no direct TCP connection
- **Auth:** ECC P-256 JWT issued by Supabase Auth

---

## Migrations

All migrations live in `supabase/migrations/` and are applied with `supabase db push`.

| File | Description |
|------|-------------|
| `20260308000001_initial_schema.sql` | Core tables: users, user_config, categorias, ingresos, egresos |
| `20260308000002_rls_policies.sql` | RLS policies for all core tables |
| `20260308000003_seed_categories.sql` | Default category seeds |
| `20260309000001_prestamos_pagos.sql` | prestamos, pagos_prestamo tables |
| `20260309000002_metas_ahorro_contribuciones.sql` | metas_ahorro, contribuciones tables |
| `20260309000003_presupuestos.sql` | presupuestos table |
| `20260310000001_recurrentes.sql` | recurrentes table |
| `20260311000001_notificaciones.sql` | notificaciones table |
| `20260316000001_fondo_emergencia.sql` | fondo_emergencia, movimientos_fondo tables |
| `20260316000002_impulso_egresos.sql` | impulso_egresos table |
| `20260316000003_suscripciones.sql` | suscripciones table |
| `20260316000004_profiles.sql` | profiles table |
| `20260316000005_retos.sql` | retos, retos_usuario tables |
| `20260316000006_educacion.sql` | lecciones, lecciones_completadas tables |
| `20260317000001_prestamos_interes.sql` | Interest fields on prestamos |
| `20260317000002_profiles_onboarding.sql` | Onboarding fields on profiles |
| `20260317000003_tarjetas.sql` | tarjetas, movimientos_tarjeta tables |
| `20260317000004_tarjetas_fix.sql` | Fixes for tarjetas schema |
| `20260318000001_nuevos_retos_lecciones.sql` | New challenges and lessons content |
| `20260318000002_tarjetas_movimientos_prestamos_amortizacion.sql` | Amortization schedule for loans |
| `20260318000003_multi_moneda_bancos.sql` | monedas, paises, bancos catalog tables; adds banco_id/pais_codigo |

---

## Tables

### User Data Tables (RLS enforced — `auth.uid() = user_id`)

#### `user_config`
User preferences and settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `user_id` | UUID | References `auth.users` |
| `moneda` | TEXT | Default currency (e.g., `DOP`) |
| `pais_codigo` | TEXT | References `paises(codigo)` |
| `created_at` | TIMESTAMPTZ | |

#### `categorias`
Custom income/expense categories.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `nombre` | TEXT | Category name |
| `tipo` | TEXT | `egreso` or `ingreso` |
| `icono` | TEXT | Emoji icon |
| `color` | TEXT | Hex color |
| `created_at` | TIMESTAMPTZ | |

#### `ingresos`
Income records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `monto` | DECIMAL | Amount |
| `descripcion` | TEXT | |
| `fecha` | DATE | |
| `categoria_id` | UUID | |
| `moneda` | TEXT | Currency code |
| `notas` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

#### `egresos`
Expense records. Same structure as `ingresos`.

#### `tarjetas`
Credit and debit cards.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `banco` | TEXT | Bank name (display) |
| `banco_id` | UUID | References `bancos(id)` |
| `banco_custom` | TEXT | Custom bank name if not in catalog |
| `titular` | TEXT | Cardholder name |
| `ultimos_digitos` | TEXT(4) | Last 4 digits |
| `tipo` | TEXT | `credito` or `debito` |
| `red` | TEXT | `visa`, `mastercard`, `amex`, `discover`, `otro` |
| `limite_credito` | DECIMAL | Credit limit (credit cards only) |
| `saldo_actual` | DECIMAL | Current balance |
| `fecha_corte` | INT | Statement closing day (1–31) |
| `fecha_pago` | INT | Payment due day (1–31) |
| `color` | TEXT | Card background color |
| `activa` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `movimientos_tarjeta`
Card transactions (purchases and payments).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `tarjeta_id` | UUID | References `tarjetas(id)` |
| `tipo` | TEXT | `compra` or `pago` |
| `monto` | DECIMAL | |
| `descripcion` | TEXT | |
| `fecha` | DATE | |
| `egreso_id` | UUID | Linked expense record (for purchases) |
| `categoria_id` | UUID | |
| `notas` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

#### `prestamos`
Loans.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `tipo` | TEXT | `me_deben` or `yo_debo` |
| `persona` | TEXT | Name of the other party |
| `monto` | DECIMAL | Original amount |
| `moneda` | TEXT | |
| `fecha_prestamo` | DATE | |
| `fecha_vencimiento` | DATE | |
| `descripcion` | TEXT | |
| `tasa_interes` | DECIMAL | Annual interest rate |
| `saldo_pendiente` | DECIMAL | Remaining balance |
| `estado` | TEXT | `activo`, `pagado`, `vencido` |
| `created_at` | TIMESTAMPTZ | |

#### `metas_ahorro`
Savings goals.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `nombre` | TEXT | |
| `monto_objetivo` | DECIMAL | Target amount |
| `monto_actual` | DECIMAL | Current amount saved |
| `fecha_objetivo` | DATE | Target date |
| `icono` | TEXT | Emoji |
| `color` | TEXT | |
| `completada` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `presupuestos`
Monthly budgets.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `categoria_id` | UUID | |
| `monto` | DECIMAL | Budget limit |
| `mes` | INT | 1–12 |
| `year` | INT | |
| `created_at` | TIMESTAMPTZ | |

#### `recurrentes`
Recurring transactions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `nombre` | TEXT | |
| `monto` | DECIMAL | |
| `tipo` | TEXT | `ingreso` or `egreso` |
| `frecuencia` | TEXT | `diario`, `semanal`, `mensual`, `anual` |
| `fecha_inicio` | DATE | |
| `fecha_fin` | DATE | |
| `categoria_id` | UUID | |
| `moneda` | TEXT | |
| `activo` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `notificaciones`
In-app notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `titulo` | TEXT | |
| `mensaje` | TEXT | |
| `tipo` | TEXT | Notification category |
| `leida` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `fondo_emergencia`
Emergency fund configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `monto_objetivo` | DECIMAL | Target amount |
| `monto_actual` | DECIMAL | Current amount |
| `meses_cobertura` | INT | Target coverage in months |
| `created_at` | TIMESTAMPTZ | |

#### `suscripciones`
Subscriptions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID | |
| `nombre` | TEXT | Service name |
| `monto` | DECIMAL | |
| `moneda` | TEXT | |
| `frecuencia` | TEXT | Billing cycle |
| `fecha_renovacion` | DATE | Next renewal date |
| `activa` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

#### `profiles`
User profile with onboarding data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Same as `auth.users.id` |
| `nombre` | TEXT | Display name |
| `pais_codigo` | TEXT | |
| `onboarding_completado` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

---

### Catalog Tables (public read — no auth required)

#### `monedas`
| Column | Type |
|--------|------|
| `codigo` | TEXT PK (ISO 4217) |
| `nombre` | TEXT |
| `simbolo` | TEXT |
| `activa` | BOOLEAN |

**Seeds:** DOP, USD, EUR, MXN, COP, ARS, BRL, GBP, CAD, CLP, PEN

#### `paises`
| Column | Type |
|--------|------|
| `codigo` | TEXT PK (ISO 3166-1 alpha-2) |
| `nombre` | TEXT |
| `moneda_codigo` | TEXT FK → monedas |
| `activo` | BOOLEAN |

**Seeds:** DO, US, ES, MX, CO, AR, BR, GB, CA, CL, PE

#### `bancos`
| Column | Type |
|--------|------|
| `id` | UUID PK |
| `nombre` | TEXT |
| `pais_codigo` | TEXT FK → paises |
| `activo` | BOOLEAN |

**Seeds:** 46 banks across all 11 countries (Banco Popular, Chase, BBVA, Santander, etc.)

---

## RLS Summary

| Table | Policy |
|-------|--------|
| User data tables | `auth.uid() = user_id` (SELECT/INSERT/UPDATE/DELETE) |
| `monedas` | `SELECT USING (true)` — public read |
| `paises` | `SELECT USING (true)` — public read |
| `bancos` | `SELECT USING (true)` — public read |
| `retos` (catalog) | `SELECT USING (true)` — public read |
| `lecciones` (catalog) | `SELECT USING (true)` — public read |

---

## Applying Migrations

```bash
# First time setup
supabase login
supabase link --project-ref omhfdzcrusahvvzoljpf

# Apply all pending migrations
supabase db push

# Create a new migration
supabase migration new my_migration_name
```
