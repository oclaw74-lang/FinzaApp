# FINZA: COMPLETE FILE REFERENCE FOR MULTI-PROFILE ANALYSIS

## Backend Files Reviewed

### Authentication & Security

**File**: `backend/app/core/security.py` (89 lines)
**Purpose**: JWT extraction and user authentication
**Key Function**: `get_current_user()` → Returns {user_id, email, role}
**Multi-Profile Impact**: Needs to extract profile_id from JWT or header
**Coupling**: 6/10 - JWT handling is standard, but user_id is globally available

```python
# Current usage pattern in ALL routes:
current_user: dict = Depends(get_current_user)
# Returns: {"user_id": "...", "email": "...", "role": "..."}
# Problem: No profile_id in response
```

---

**File**: `backend/app/core/supabase_client.py` (18 lines)
**Purpose**: Initialize Supabase clients (RLS-enforced vs admin)
**Key Functions**: 
- `get_admin_client()` → Bypasses RLS (service role key)
- `get_user_client(user_jwt)` → Enforces RLS via JWT auth
**Multi-Profile Impact**: User client always uses auth.uid() from JWT
**Coupling**: 7/10 - Client creation would need profile context

```python
# Current pattern in ALL services:
client = get_user_client(user_jwt)
# Sets JWT header → PostgREST extracts auth.uid()
# Problem: auth.uid() is always parent account, not profile
```

---

### Service Layer (14 Files)

**File**: `backend/app/services/ingresos.py` (118 lines)
**Functions Analyzed**:
1. `list_ingresos(user_jwt, user_id, ...)` → Filters by .eq("user_id", user_id)
2. `get_ingreso(user_jwt, ingreso_id, user_id)` → Double-checks user_id
3. `create_ingreso(user_jwt, user_id, data)` → Adds user_id to payload
4. `update_ingreso(user_jwt, ingreso_id, user_id, data)` → .eq("user_id", user_id)
5. `delete_ingreso(user_jwt, ingreso_id, user_id)` → Soft delete with user_id check

**Multi-Profile Impact**: 
- Every function signature would need `profile_id: str` parameter
- Every query would need `.eq("profile_id", profile_id)` added
- Estimated changes: 5 functions × 2-3 lines each = 10-15 lines per file
- Multiplied across similar services = 100+ service function changes

**Coupling**: 9/10 - Pervasive user_id filtering throughout

---

**File**: `backend/app/services/metas_ahorro.py` (301 lines)
**Functions** (7 total):
1. `get_metas(user_jwt, estado)` → `.eq("estado", estado)` + RLS filter
2. `get_meta_by_id(user_jwt, meta_id)` → `.eq("id", meta_id)` + RLS
3. `create_meta(user_jwt, user_id, data)` → `payload["user_id"] = user_id`
4. `update_meta(user_jwt, meta_id, data)` → `.eq("id", meta_id)` + RLS
5. `delete_meta(user_jwt, meta_id)` → Checks for contribuciones first
6. `get_contribuciones(user_jwt, meta_id)` → Validates ownership via subquery
7. `agregar_contribucion(user_jwt, meta_id, data)` → RPC call
8. `get_resumen(user_jwt)` → Aggregates metas_ahorro across user

**Special Note - Shared Goals**:
- Goals (metas) are a good candidate for family-wide sharing
- Current design: Each goal belongs to one user_id
- Multi-profile requirement: Might want shared goals (multiple profile_ids)
- This would require changing contribuciones_meta to have optional family_group_id

**Coupling**: 9/10 - Complex logic around ownership validation via JOINs

---

**File**: `backend/app/services/profiles.py` (67 lines)
**Functions** (2 total):
1. `get_or_create_profile(user_jwt, user_id)` → 1:1 relationship
2. `update_profile(user_jwt, user_id, data)` → Upserts profiles record

**Key Issue**:
- Assumes single profile per user_id
- profiles.user_id is PRIMARY KEY
- Would need SCHEMA CHANGE to support multiple profiles

**Coupling**: 9/10 - Fundamental assumption of 1:1 relationship

---

**Other Service Files** (Pattern is identical across all):
- `egresos.py` - 5+ functions, .eq("user_id", user_id)
- `prestamos.py` - 4+ functions, includes RPC registrar_pago_prestamo()
- `presupuestos.py` - CRUD, .eq("user_id", user_id)
- `recurrentes.py` - CRUD, .eq("user_id", user_id)
- `notificaciones.py` - List/Create, .eq("user_id", user_id)
- `suscripciones.py` - CRUD, .eq("user_id", user_id)
- `tarjetas.py` - CRUD for cards, .eq("user_id", user_id)
- `movimientos_tarjeta.py` - Card transactions, .eq("user_id", user_id)
- `retos.py` - User challenge participation, .eq("user_id", user_id)
- `educacion.py` - User lesson progress, .eq("user_id", user_id)
- `fondo_emergencia.py` - Single emergency fund, .eq("user_id", user_id)
- `categorias.py` - User custom categories, .eq("user_id", user_id)

**Total Service Functions Affected**: 40+
**Pattern Repetition**: ALL follow identical user_id filtering pattern

---

### Routes (19 Files)

**File**: `backend/app/api/v1/routes/profiles.py` (25 lines)
**Endpoints**:
- `GET /profiles/me` → Returns current user's profile
- `PATCH /profiles/me` → Updates current user's profile

**For Multi-Profile**:
```python
# NEW endpoints needed:
GET    /profiles               # List all family profiles
POST   /profiles               # Create new profile
GET    /profiles/{profile_id}  # Get specific profile
PATCH  /profiles/{profile_id}  # Update specific profile
DELETE /profiles/{profile_id}  # Delete profile
POST   /profiles/{profile_id}/activate  # Set active profile
```

**Coupling**: 8/10 - Route design assumes single profile per user

---

**Routes in routes/metas.py, routes/ingresos.py, etc.** (Estimated 19 files)
**Current Pattern**:
```python
@router.get("/items")
async def list_items(
    current_user: dict = Depends(get_current_user),
    token: str = Depends(get_raw_token),
) -> dict:
    return service.list_items(
        user_jwt=token,
        user_id=current_user["user_id"],  # ONLY user_id passed
    )
```

**For Multi-Profile**:
```python
@router.get("/items")  # OR /profiles/{profile_id}/items ?
async def list_items(
    profile_id: str = Header(...),  # OR path parameter
    current_user: dict = Depends(get_current_user),
    token: str = Depends(get_raw_token),
) -> dict:
    # Validate ownership
    if not is_profile_owner(profile_id, current_user["user_id"]):
        raise HTTPException(403, "Unauthorized")
    
    return service.list_items(
        user_jwt=token,
        user_id=current_user["user_id"],
        profile_id=profile_id,  # MUST pass profile_id
    )
```

**Question**: Keep current routes, add header? Or nest under /profiles/{id}/...?
- `/profiles/{id}/ingresos` vs `/ingresos` with `X-Profile-ID` header
- Former is cleaner but requires massive route restructuring

---

## Frontend Files Reviewed

**File**: `frontend/src/store/authStore.ts` (36 lines)
**Current State**:
```typescript
interface AuthStore {
  session: Session | null      // Single JWT session
  user: User | null             // Single user from session
  isLoading: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
  initialize: () => Promise<() => void>
}
```

**Changes for Multi-Profile**:
```typescript
interface AuthStore {
  session: Session | null
  user: User | null
  profiles: FamilyProfile[]           // NEW - list of profiles
  activeProfileId: UUID | null        // NEW - currently active
  isLoading: boolean
  setSession: (session: Session | null) => void
  setActiveProfile: (profileId: UUID) => void    // NEW
  fetchProfiles: () => Promise<void>  // NEW
  signOut: () => Promise<void>
  initialize: () => Promise<() => void>
}
```

**Impact**: 
- Must fetch profiles list after login
- Must track activeProfileId in store
- Must reissue JWT OR add header on profile switch
- All dependent components must listen to activeProfileId changes

**Coupling**: 8/10 - Currently assumes single user context throughout app

---

**File**: `frontend/src/hooks/useProfile.ts` (25 lines)
**Current Hook**:
```typescript
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],              // Static key
    queryFn: async (): Promise<ProfileData> => {
      const { data } = await apiClient.get('/profiles/me')  // /me endpoint
      return data as ProfileData
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

**Changes for Multi-Profile**:
```typescript
export function useProfile(profileId: UUID | null) {
  const activeProfile = useAuthStore((s) => s.activeProfileId)
  const id = profileId || activeProfile
  
  return useQuery({
    queryKey: ['profile', id],           // Add profileId to key
    queryFn: async (): Promise<ProfileData> => {
      if (!id) throw new Error('No profile selected')
      const { data } = await apiClient.get(`/profiles/${id}`)  // /profiles/:id
      return data as ProfileData
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,  // Don't fetch if no profile selected
  })
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<FamilyProfile[]> => {
      const { data } = await apiClient.get('/profiles')
      return data
    },
  })
}
```

**Impact**: 
- Query keys must include profileId
- Must invalidate when profile switches
- Need new hook to fetch all profiles
- All other hooks (useIngresos, useMetas, etc.) must also include profileId

**Coupling**: 7/10 - Hooks assume single profile, manageable to refactor

---

## Database Schema - All Migrations

### Initial Schema (Migration 1-3)

**Migration 1**: Tables created:
- user_config (1:1 with user_id UNIQUE)
- categorias (N:1 with user_id nullable)
- subcategorias (N:1 with user_id nullable)
- ingresos (N:1 with user_id NOT NULL)
- egresos (N:1 with user_id NOT NULL)

**Migration 2**: RLS Policies added
- All 5 tables: SELECT/INSERT/UPDATE/DELETE
- Policies: auth.uid() = user_id

**Migration 3**: System categories seeded (user_id IS NULL)

---

### Domains (Migrations 4-8)

**Migration 4**: Loans domain
- prestamos (N:1 user_id, includes tipo_prestamo enum)
- pagos_prestamo (N:1 user_id, FK to prestamos)
- RPC: registrar_pago_prestamo() - atomic pago insertion + update

**Migration 5**: Savings goals domain  
- metas_ahorro (N:1 user_id)
- contribuciones_meta (via meta_id, indirect ownership)
- RPC: agregar_contribucion_meta() - atomic contribution + monto_actual update

**Migration 6**: Budgets domain
- presupuestos (N:1 user_id, unique per user+categoria+mes+year)

**Migration 7**: Recurring domain
- recurrentes (N:1 user_id, tipo enum ingreso|egreso)

**Migration 8**: Notifications domain
- notificaciones (N:1 user_id, tipo enum urgente|informativa|logro)

---

### Features (Migrations 9-14)

**Migration 9**: Emergency fund
- fondo_emergencia (1:1 UNIQUE user_id)
- Single record per account

**Migration 10**: Impulse detection
- ALTER egresos: add is_impulso, impulso_clasificado columns
- For tracking impulse purchases vs planned

**Migration 11**: Subscriptions
- suscripciones (N:1 user_id)
- auto_detectada flag for auto-detection feature

**Migration 12**: Enhanced profiles
- profiles (1:1 PRIMARY KEY user_id)
- Add onboarding_completed
- Current: Only stores salary + mostrar_horas_trabajo

**Migration 13**: Challenges & Education
- retos (system table, no user_id)
- user_retos (N:1 user_id, tracks participation)
- lecciones (system table, no user_id)
- user_lecciones (N:1 user_id, tracks progress)

**Migration 14**: Loan enhancements
- ALTER prestamos: add tasa_interes, plazo_meses
- For amortization calculations

---

### Cards (Migrations 15-18)

**Migration 15**: Tarjetas
- tarjetas (N:1 user_id)
- Supports both credit and debit cards
- Stores banco, titular, ultimos_digitos, limite_credito, saldo_actual, fecha_corte, fecha_pago

**Migration 16**: Tarjetas fix
- Relax constraints (red, titular, color)
- Fix ENUM values

**Migration 17**: Card movements
- movimientos_tarjeta (N:1 user_id, FK to tarjetas)
- Tipo enum: compra | pago
- Links to egresos via egreso_id
- RPC: registrar_movimiento_tarjeta() - atomic movement + saldo update

**Migration 18**: Loan payment enhancements
- ALTER pagos_prestamo: add monto_capital, monto_interes, numero_cuota
- Enhanced RPC: registrar_pago_prestamo() with amortization logic
- ALTER egresos: add tarjeta_id, pago_prestamo_id

---

### System Data (Migrations 19-21)

**Migration 19**: New retos & lecciones
- Insert 6 new retos (24-hour rule, restaurant week, etc.)
- Insert 5 new lecciones (advanced topics)

**Migration 20**: Multi-currency & Banks
- CREATE monedas (11: DOP, USD, EUR, MXN, COP, ARS, BRL, GBP, CAD, CLP, PEN)
- CREATE paises (11 countries)
- CREATE bancos (40+ banks across countries)
- ALTER tarjetas: add banco_id, banco_custom
- ALTER user_config: add pais_codigo, moneda (change from ENUM to TEXT)

---

## Summary Statistics

### Tables
- **Total**: 24 tables
- **User-owned**: 19 tables
- **System/Catalog**: 5 tables
- **With RLS**: 23 tables
- **With user_id FK**: 19 tables

### Policies
- **Total RLS Policies**: 50+
- **Pattern**: auth.uid() = user_id (99% of cases)
- **Indirect**: contribuciones_meta, movimientos_tarjeta (via relationship)

### Service Functions
- **Total**: 40+ functions across 14 files
- **Pattern**: All receive (user_jwt, user_id, ...) parameters
- **Required Changes**: Add profile_id parameter to all

### Routes
- **Total**: 19 route files (estimated)
- **Pattern**: All use `Depends(get_current_user)`
- **Required Changes**: Extract profile_id from path/header, validate ownership

### Frontend Hooks
- **Total**: 10+ custom hooks (useProfile, useIngresos, useMetas, etc.)
- **Pattern**: All use static queryKey without profile context
- **Required Changes**: Add profileId to queryKey, fetch based on active profile

