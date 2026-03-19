# FINZA: Multi-Profile/Family Features Feasibility Study
## Complete Architecture & Data Model Analysis

---

## EXECUTIVE SUMMARY

The Finza application is **tightly coupled to a single user_id per account** throughout its entire stack:
- **Database**: 23+ tables directly reference `auth.users(id)`
- **Backend**: All services implicitly assume single user context via RLS
- **Frontend**: Auth store manages single session/user
- **Security**: Row-Level Security (RLS) enforces user isolation

**Scope of changes required**: SIGNIFICANT — Estimated 30-40% of codebase requires modification to support multi-profile/family features.

---

## 1. DATABASE SCHEMA ANALYSIS

### 1.1 All Tables with Direct user_id References to auth.users(id)

**User-Owned Data Tables (19 tables):**
1. **user_config** - 1:1 (UNIQUE constraint), stores timezone, currency, notification preferences
2. **profiles** - 1:1 (PRIMARY KEY = user_id), stores salary, onboarding status
3. **categorias** - N:1 (user_id nullable), custom income/expense categories
4. **subcategorias** - N:1 (user_id nullable), custom subcategories
5. **ingresos** - N:1 (NOT NULL), income transactions
6. **egresos** - N:1 (NOT NULL), expense transactions + tarjeta_id + pago_prestamo_id
7. **prestamos** - N:1 (NOT NULL), loans with interest/amortization
8. **pagos_prestamo** - N:1 (NOT NULL), loan payments with capital/interest breakdown
9. **metas_ahorro** - N:1 (NOT NULL), savings goals
10. **contribuciones_meta** - N:1 (indirect via meta_id), goal contributions
11. **presupuestos** - N:1 (NOT NULL), monthly budget limits per category
12. **recurrentes** - N:1 (NOT NULL), recurring income/expenses
13. **notificaciones** - N:1 (NOT NULL), user notifications
14. **fondo_emergencia** - 1:1 (UNIQUE), emergency fund
15. **suscripciones** - N:1 (NOT NULL), subscription tracking
16. **tarjetas** - N:1 (NOT NULL), bank/credit cards
17. **movimientos_tarjeta** - N:1 (NOT NULL), card transactions
18. **user_retos** - N:1 (NOT NULL), user challenge participation
19. **user_lecciones** - N:1 (NOT NULL), user lesson progress

**System/Catalog Tables (5 tables - NO user_id):**
- monedas, paises, bancos, retos, lecciones

### 1.2 RLS Policies Summary

ALL 23 tables with user data have RLS enabled. Policies follow consistent pattern:

```sql
CREATE POLICY "table_select_own" ON table
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "table_insert_own" ON table
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "table_update_own" ON table
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "table_delete_own" ON table
    FOR DELETE USING (auth.uid() = user_id);
```

**Indirect RLS (via relationship):**
```sql
-- contribuciones_meta checks ownership via parent metas_ahorro
CREATE POLICY "contribuciones_meta_select_own" ON contribuciones_meta
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM metas_ahorro
            WHERE metas_ahorro.id = contribuciones_meta.meta_id
            AND metas_ahorro.user_id = auth.uid())
    );
```

**Critical Issue for Multi-Profile**: 
- All policies use `auth.uid()` which is PER ACCOUNT, not per profile
- Would require JWT reissuance on profile switch OR custom RLS context OR admin client bypass

---

## 2. BACKEND AUTHENTICATION FLOW

### 2.1 JWT Extraction (security.py)

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    # Verifies JWT signature (ES256 or HS256)
    # Extracts payload['sub'] = user_id from auth.users(id)
    return {
        "user_id": user_id,          # SINGLE - from JWT claim
        "email": payload.get("email"),
        "role": payload.get("role"),
    }
```

**For Multi-Profile**: Would need to extract/validate profile_id from:
- Custom JWT claim (app_metadata.profile_id)
- Custom header (X-Profile-ID) 
- Request path parameter

### 2.2 User-Scoped Supabase Client (supabase_client.py)

```python
def get_user_client(user_jwt: str) -> Client:
    """Creates Supabase client with RLS enforcement via JWT"""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    client.postgrest.auth(user_jwt)  # Sets Authorization header with JWT
    return client
```

**How it works**:
- JWT in header → PostgREST middleware extracts auth.uid()
- All queries automatically filtered: WHERE user_id = auth.uid()
- This is the security mechanism that prevents user A from seeing user B's data

**For Multi-Profile**:
- Option A: Extend JWT with profile claim + reissue on profile switch
- Option B: Use admin client + manual profile_id validation (loses RLS safety)
- Option C: Use PostgreSQL SET command to set profile context

### 2.3 Service Layer Pattern (ingresos.py - REPRESENTATIVE)

```python
def list_ingresos(
    user_jwt: str,
    user_id: str,  # Passed from route handler
    fecha_desde: str | None = None,
    ...
) -> dict:
    client = get_user_client(user_jwt)  # RLS-enforced client
    query = (
        client.table("ingresos")
        .select("*, categorias(...)")
        .eq("user_id", user_id)          # EXPLICIT filter (redundant with RLS)
        .is_("deleted_at", "null")
        # More filters...
    )
    response = query.execute()
    return {...}
```

**Pattern across ALL services (14 files, 40+ functions)**:
1. Receive `user_jwt` and `user_id` parameters
2. Get RLS-enforced client
3. Add explicit `.eq("user_id", user_id)` filter (redundant safety check)
4. Execute and return data

**Services affected**: ingresos, egresos, prestamos, metas_ahorro, presupuestos, 
recurrentes, notificaciones, suscripciones, tarjetas, movimientos_tarjeta, retos, 
educacion, fondo_emergencia, categorias

---

## 3. PROFILE SYSTEM (Current - Single Profile)

### 3.1 profiles.py Service

```python
def get_or_create_profile(user_jwt: str, user_id: str) -> dict:
    """Fetches single profile for user, creates if missing"""
    client = get_user_client(user_jwt)
    response = (
        client.table("profiles")
        .select("*")
        .eq("user_id", user_id)         # WHERE user_id = <current_user>
        .maybe_single()
        .execute()
    )
    
    if response.data:
        return _enrich(response.data)
    
    # Create default profile if missing
    r2 = client.table("profiles").insert({"user_id": user_id}).execute()
    return _enrich(r2.data[0])
```

**Current Profile Schema**:
- `user_id` (PK) - 1:1 with auth.users(id)
- `salario_mensual_neto` - monthly salary
- `mostrar_horas_trabajo` - boolean flag
- `onboarding_completed` - boolean flag
- `horas_por_peso` - computed (160.0 / salary)

**Problem**: profiles.user_id is PRIMARY KEY. To support multiple profiles:
- Need new `family_profiles` table
- Make profiles.profile_id FK to family_profiles(id)
- Or change profiles.user_id from PK to FK pair

### 3.2 Profile Routes (profiles.py)

```python
@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_or_create_profile(user_jwt=token, user_id=current_user["user_id"])

@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.update_profile(user_jwt=token, user_id=current_user["user_id"], data=data)
```

**For Multi-Profile, need**:
- `GET /profiles` - list all family profiles
- `POST /profiles` - create new profile
- `GET /profiles/{profile_id}` - fetch specific profile
- `PATCH /profiles/{profile_id}` - update specific profile
- `DELETE /profiles/{profile_id}` - delete profile (with cascade handling)
- `POST /profiles/{profile_id}/activate` - set active profile

---

## 4. FRONTEND AUTHENTICATION STATE

### 4.1 authStore.ts (Zustand)

```typescript
interface AuthStore {
  session: Session | null          // Supabase session
  user: User | null                 // Current user from session.user
  isLoading: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
  initialize: () => Promise<() => void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => set({ session, user: session?.user ?? null, isLoading: false }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, isLoading: false })
  },
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, isLoading: false })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(...)
    return () => subscription.unsubscribe()
  },
}))
```

**Current limitation**: Single session per browser session. For multi-profile:

```typescript
interface AuthStore {
  session: Session | null
  user: User | null
  profiles: FamilyProfile[]           // NEW
  activeProfileId: UUID | null        // NEW
  isLoading: boolean
  setSession: (session: Session | null) => void
  setActiveProfile: (profileId: UUID) => void  // NEW
  fetchProfiles: () => Promise<void>  // NEW
  signOut: () => Promise<void>
  initialize: () => Promise<() => void>
}
```

### 4.2 useProfile Hook

```typescript
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileData> => {
      const { data } = await apiClient.get('/profiles/me')
      return data as ProfileData
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ProfileUpdate): Promise<ProfileData> => {
      const { data } = await apiClient.patch('/profiles/me', payload)
      return data as ProfileData
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  })
}
```

**For Multi-Profile**:
```typescript
export function useProfile(profileId: UUID | null) {
  return useQuery({
    queryKey: ['profile', profileId],  // Add profileId to key
    queryFn: async (): Promise<ProfileData> => {
      if (!profileId) throw new Error('No profile selected')
      const { data } = await apiClient.get(`/profiles/${profileId}`)
      return data as ProfileData
    },
  })
}
```

---

## 5. MIGRATION FILES SUMMARY

**21 total migrations created (in order)**:

1. **20260308000001_initial_schema.sql** - user_config, categorias, subcategorias, ingresos, egresos
2. **20260308000002_rls_policies.sql** - RLS on 5 tables
3. **20260308000003_seed_categories.sql** - 14 system categories
4. **20260309000001_prestamos_pagos.sql** - prestamos, pagos_prestamo, RPC registrar_pago_prestamo()
5. **20260309000002_metas_ahorro_contribuciones.sql** - metas_ahorro, contribuciones_meta, RPC agregar_contribucion_meta()
6. **20260309000003_presupuestos.sql** - presupuestos
7. **20260310000001_recurrentes.sql** - recurrentes
8. **20260311000001_notificaciones.sql** - notificaciones
9. **20260316000001_fondo_emergencia.sql** - fondo_emergencia (1:1)
10. **20260316000002_impulso_egresos.sql** - ALTER egresos (add is_impulso, impulso_clasificado)
11. **20260316000003_suscripciones.sql** - suscripciones
12. **20260316000004_profiles.sql** - profiles (1:1 with user_id as PK)
13. **20260316000005_retos.sql** - retos (system), user_retos (user participation)
14. **20260316000006_educacion.sql** - lecciones (system), user_lecciones (user progress)
15. **20260317000001_prestamos_interes.sql** - ALTER prestamos (add tasa_interes, plazo_meses)
16. **20260317000002_profiles_onboarding.sql** - ALTER profiles (add onboarding_completed)
17. **20260317000003_tarjetas.sql** - tarjetas (bank/credit cards)
18. **20260317000004_tarjetas_fix.sql** - ALTER tarjetas (fix constraints)
19. **20260318000001_nuevos_retos_lecciones.sql** - Insert 6 new retos, 5 new lecciones
20. **20260318000002_tarjetas_movimientos_prestamos_amortizacion.sql** - movimientos_tarjeta, RPC registrar_movimiento_tarjeta(), enhance egresos/pagos_prestamo
21. **20260318000003_multi_moneda_bancos.sql** - monedas, paises, bancos catalog tables

---

## 6. IMPLEMENTATION IMPACT ANALYSIS

### Tables Requiring Schema Changes (19 total)

To support multi-profile, each needs `profile_id UUID FK to family_profiles(id)`:

**High Priority (frequently queried)**:
- ingresos, egresos, metas_ahorro, presupuestos, recurrentes

**Medium Priority (periodic queries)**:
- prestamos, pagos_prestamo, suscripciones, tarjetas, notificaciones

**Lower Priority (less frequent)**:
- categorias, subcategorias, fondo_emergencia, movimientos_tarjeta, user_retos, user_lecciones

**New Table Required**:
```sql
CREATE TABLE family_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('principal', 'hijo', 'pareja', 'otro')),
    edad INTEGER,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, nombre)
);
```

### Service Functions Requiring Changes (40+ across 14 files)

Each function needs to accept `profile_id` parameter and filter by it.

**High-Touch Services**:
- metas_ahorro.py - 7 functions
- ingresos.py - 5 functions
- egresos.py - 5 functions
- prestamos.py - 4 functions
- presupuestos.py - 4 functions

### Route Handlers Requiring Changes (50+ across 19 route files)

Each endpoint needs to:
1. Extract `profile_id` from path/header
2. Validate profile ownership
3. Pass `profile_id` to service layer

---

## 7. COMPLEXITY & RISK ASSESSMENT

### Tight Coupling Score: 8.5/10 (High)

| Component | Coupling | Change Effort |
|-----------|----------|----------------|
| RLS Policies | 10/10 | CRITICAL - 23 policy rewrites |
| Service Layer | 9/10 | CRITICAL - 40+ function signatures |
| Route Handlers | 9/10 | CRITICAL - 50+ endpoint changes |
| Database Schema | 8/10 | HIGH - 19 table migrations |
| Frontend State | 7/10 | HIGH - New auth store fields |
| Frontend Hooks | 6/10 | MEDIUM - Query key changes |
| Frontend UI | 5/10 | MEDIUM - Profile switcher component |

### Estimated Implementation Timeline

- **Phase 1 (Database)**: 2-3 weeks (schema + RLS rewrites)
- **Phase 2 (Backend)**: 3-4 weeks (services + routes + validation)
- **Phase 3 (Frontend)**: 2-3 weeks (auth store + hooks + UI)
- **Phase 4 (Testing)**: 2-3 weeks (RLS tests + isolation tests)

**Total**: 9-13 weeks for full implementation

### Testing Scope

- 23 RLS policy test cases
- 40+ service function tests with profile isolation
- 15+ route handler tests
- Cross-profile data isolation tests
- Performance regression tests
- Admin endpoints for multi-profile management

---

## 8. KEY FINDINGS & RECOMMENDATIONS

### ✅ What's Working Well

1. **Clean RLS Foundation** - Current policies are well-structured
2. **Service Abstraction** - Business logic is separate from routes
3. **Consistent Patterns** - Similar user_id filtering everywhere (predictable refactoring)
4. **Type Safety** - Python Pydantic models + TypeScript interfaces

### ⚠️ Major Challenges

1. **Pervasive Single-User Assumption** - 40+ functions assume one user_id
2. **RLS Hardcoding** - 23 policies all reference auth.uid() directly
3. **Schema Coupling** - 19 tables have 1:N or 1:1 user relationship
4. **No Feature Flag Infrastructure** - Can't roll out gradually
5. **JWT Constraint** - Profile context must be added to JWT or use admin client

### 🎯 Recommended Approach

**Option A: Custom JWT Claims (Most Secure)**
1. Add `app_metadata.profile_id` to Supabase JWT on auth
2. Reissue JWT when user switches profiles
3. Modify RLS policies to check both user_id AND profile_id
4. Update all services to extract profile_id from JWT

**Pros**: Maintains RLS security, clean separation of concerns
**Cons**: Requires Supabase auth service changes, JWT reissuance latency

**Option B: Admin Client + Manual Validation (Fastest to MVP)**
1. Use `get_admin_client()` (bypasses RLS)
2. Add explicit profile_id validation in service layer
3. Create middleware to check profile ownership
4. Implement later in favor of proper RLS

**Pros**: Faster implementation, fewer RLS changes initially
**Cons**: Loses RLS protection, security risk if validation is missed, performance hit

---

## 9. QUESTIONS FOR STAKEHOLDERS

1. **Profile Types**: Parent + children, or include partners/spouses/roommates?
2. **Permissions Model**: 
   - Can children see parent spending?
   - Can parents set allowances?
   - Are some categories private per-profile?
3. **Shared Features**: 
   - Which data is per-profile vs. shared (budgets, goals, subscriptions)?
   - Family dashboard for parents?
4. **MVP Scope**: 
   - Basic multi-profile (separate data buckets)?
   - Or family-wide features (shared budgets, allowances)?
5. **Timeline**: How soon is this needed?
6. **Mobile**: iOS/Android support requirement?

---

## 10. CONCLUSION

The Finza application has a **clean but tightly-coupled single-user architecture**. 

Multi-profile/family features are **technically feasible** but represent **significant engineering effort** (30-40% codebase changes). 

The recommended path is starting with **Option A (Custom JWT Claims)** for production robustness, with **Option B (Admin Client)** as interim MVP if timeline is critical.

