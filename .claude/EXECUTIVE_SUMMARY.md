# FINZA MULTI-PROFILE FEASIBILITY - EXECUTIVE SUMMARY

## Quick Assessment

| Metric | Rating | Status |
|--------|--------|--------|
| **Technical Feasibility** | ✅ HIGH | Architecturally sound, clear patterns |
| **Implementation Complexity** | ⚠️ MEDIUM-HIGH | Significant but manageable scope |
| **Timeline Estimate** | 9-13 weeks | Full implementation with testing |
| **Codebase Coupling** | 🔴 TIGHT | 30-40% of code needs changes |
| **Risk Level** | 🟠 MEDIUM | RLS rewrites + data migration are critical |

---

## The Core Problem

**Current State**: Finza is built as a single-user-per-account application
```
1 auth.users(id) → 1 user_config
                  → 1 profiles
                  → N ingresos (owned by that user)
                  → N egresos (owned by that user)
                  → N metas (owned by that user)
                  ... (18 more tables like this)
```

**Desired State**: Support multiple profiles within one account
```
1 auth.users(id) → 1 user_config
                 → N family_profiles (NEW)
                    ├─ Profile A (Principal)
                    │  → profile_specific ingresos
                    │  → profile_specific egresos
                    │  → profile_specific metas
                    └─ Profile B (Child)
                       → profile_specific ingresos
                       → profile_specific egresos
                       → profile_specific metas
```

---

## Scope Summary

### What Needs to Change

**Database Layer**
- ❌ 19 tables need schema changes (add profile_id FK)
- ❌ 23 RLS policies need rewriting
- ❌ 1 new table (family_profiles)
- ⏳ Significant data migration (existing records → default profile)

**Backend Layer**
- ❌ 40+ service functions need signature changes
- ❌ 50+ route handlers need modification
- ❌ Security layer needs profile context extraction
- ✅ No new architectural patterns required (good news!)

**Frontend Layer**
- ❌ Auth store needs new profile state
- ❌ Query hooks need profileId in query key
- ❌ API calls need profile routing
- ✅ No new component architecture required

### What Can Stay the Same

- ✅ Business logic remains identical
- ✅ Database structure (adding profile_id is non-breaking)
- ✅ Component patterns (same React/Vue patterns)
- ✅ API response formats (same schemas)

---

## Detailed Change Breakdown

### 1. Database Changes (Complexity: HIGH)

**Step 1: Create family_profiles table**
```sql
CREATE TABLE family_profiles (
    id UUID PRIMARY KEY,
    user_id UUID FK,
    nombre TEXT,
    tipo ENUM ('principal', 'hijo', 'pareja'),
    activo BOOLEAN,
    ...
);
```

**Step 2: Add profile_id to 19 tables**
Example for ingresos:
```sql
ALTER TABLE ingresos ADD COLUMN profile_id UUID FK;
UPDATE ingresos SET profile_id = (
    SELECT id FROM family_profiles 
    WHERE family_profiles.user_id = ingresos.user_id 
    LIMIT 1  -- Map to principal profile
);
ALTER TABLE ingresos ADD CONSTRAINT NOT NULL profile_id;
CREATE INDEX idx_ingresos_profile_id;
```

**Affected tables**: ingresos, egresos, metas_ahorro, presupuestos, recurrentes, 
suscripciones, tarjetas, prestamos, pagos_prestamo, notificaciones, 
movimientos_tarjeta, fondo_emergencia, categorias, subcategorias, 
user_retos, user_lecciones

**Step 3: Rewrite 23 RLS policies**
From:
```sql
CREATE POLICY "ingresos_select_own" ON ingresos
    FOR SELECT USING (auth.uid() = user_id);
```

To:
```sql
CREATE POLICY "ingresos_select_own" ON ingresos
    FOR SELECT USING (
        user_id = auth.uid() AND 
        profile_id = ANY(
            SELECT id FROM family_profiles 
            WHERE user_id = auth.uid() AND activo = true
        )
    );
```

**OR with custom JWT claim**:
```sql
CREATE POLICY "ingresos_select_own" ON ingresos
    FOR SELECT USING (
        user_id = auth.uid() AND 
        profile_id = (auth.jwt() ->> 'profile_id')::UUID
    );
```

**Timeline**: 2-3 weeks (includes testing)

---

### 2. Backend Changes (Complexity: HIGH)

**Pattern 1: Service function signature changes**

From:
```python
def list_ingresos(user_jwt: str, user_id: str, ...) -> dict:
    client = get_user_client(user_jwt)
    query = client.table("ingresos").select(...).eq("user_id", user_id)
    return {...}
```

To:
```python
def list_ingresos(user_jwt: str, user_id: str, profile_id: str, ...) -> dict:
    client = get_user_client(user_jwt)
    query = client.table("ingresos").select(...).eq("user_id", user_id).eq("profile_id", profile_id)
    return {...}
```

**Affected**: 40+ functions across 14 service files
- metas_ahorro.py: 7 functions
- ingresos.py: 5 functions
- egresos.py: 5 functions
- prestamos.py: 4 functions
- presupuestos.py: 4 functions
- (+ 9 more service files)

**Pattern 2: Route handler changes**

From:
```python
@router.get("/ingresos")
async def list_ingresos(
    current_user: dict = Depends(get_current_user),
    token: str = Depends(get_raw_token),
    ...
):
    return svc.list_ingresos(token, current_user["user_id"], ...)
```

To:
```python
@router.get("/ingresos")
async def list_ingresos(
    profile_id: str = Header(...),  # Get from header
    current_user: dict = Depends(get_current_user),
    token: str = Depends(get_raw_token),
    ...
):
    # Validate ownership
    if not verify_profile_ownership(profile_id, current_user["user_id"]):
        raise HTTPException(403)
    
    return svc.list_ingresos(token, current_user["user_id"], profile_id, ...)
```

**Affected**: 50+ endpoints across 19 route files

**Pattern 3: JWT/Auth context changes**

From:
```python
def get_current_user(credentials) -> dict:
    return {"user_id": ..., "email": ..., "role": ...}
```

To:
```python
def get_current_user(credentials) -> dict:
    payload = decode_jwt(...)
    return {
        "user_id": ...,
        "email": ...,
        "role": ...,
        "profile_id": ...,  # NEW (from custom JWT claim or header)
    }
```

**Timeline**: 3-4 weeks (includes all service + route changes + testing)

---

### 3. Frontend Changes (Complexity: MEDIUM)

**Pattern 1: Auth store changes**

From:
```typescript
interface AuthStore {
  session: Session | null
  user: User | null
  isLoading: boolean
}
```

To:
```typescript
interface AuthStore {
  session: Session | null
  user: User | null
  profiles: FamilyProfile[]
  activeProfileId: UUID | null
  isLoading: boolean
  setActiveProfile: (id: UUID) => Promise<void>
  fetchProfiles: () => Promise<void>
}
```

**Changes needed**:
- After login: fetch profiles list
- On profile switch: update JWT OR add header
- Persist activeProfileId to localStorage
- Invalidate all data queries when switching

**Pattern 2: Hook changes**

From:
```typescript
useQuery({
  queryKey: ['ingresos'],
  queryFn: () => api.get('/ingresos')
})
```

To:
```typescript
const profileId = useAuthStore(s => s.activeProfileId)
useQuery({
  queryKey: ['ingresos', profileId],  // ADD profileId
  queryFn: () => api.get(`/ingresos?profile_id=${profileId}`),
  enabled: !!profileId
})
```

**Affected**: All data-fetching hooks (useIngresos, useMetas, usePresupuestos, etc.)

**Pattern 3: UI components**

Add profile switcher:
```typescript
export function ProfileSwitcher() {
  const { profiles, activeProfileId, setActiveProfile } = useAuthStore()
  
  return (
    <select value={activeProfileId} onChange={(e) => setActiveProfile(e.target.value)}>
      {profiles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  )
}
```

**Timeline**: 2-3 weeks (includes UI, hooks, store, testing)

---

## Implementation Strategy

### Option A: Custom JWT Claims (Recommended)

**Flow**:
1. User logs in → Get JWT from Supabase
2. Fetch profiles list via API
3. User selects profile
4. Request new JWT with profile_id in custom claims
5. All subsequent requests use JWT with profile_id embedded
6. RLS policies check both user_id AND profile_id from JWT

**Pros**:
- ✅ Maintains RLS security layer
- ✅ No manual profile ownership checks needed
- ✅ Profile context is in JWT (distributed)
- ✅ Scales well (no per-request validation needed)

**Cons**:
- ⚠️ Requires Supabase auth modifications
- ⚠️ JWT reissuance latency on profile switch
- ⚠️ More complex JWT payload handling

**Complexity**: MEDIUM

---

### Option B: Admin Client + Manual Validation (Faster MVP)

**Flow**:
1. User logs in → Get JWT
2. Fetch profiles list via API
3. All subsequent queries use admin client (bypasses RLS)
4. Every service function validates profile ownership manually
5. Middleware verifies user can access requested profile

**Pros**:
- ✅ Faster initial implementation (no RLS rewrites immediately)
- ✅ Fewer dependencies on Supabase features
- ✅ Can implement incrementally

**Cons**:
- ⚠️ Loses RLS security layer (critical)
- ⚠️ Manual validation on EVERY query (slow)
- ⚠️ Risk of missing validation somewhere
- ⚠️ Performance hit vs RLS-enforced queries
- ⚠️ Technical debt (must refactor to Option A later)

**Complexity**: LOW (but risky)

---

### Option C: PostgreSQL Custom Context (Complex)

**Flow**:
1. Middleware sets PostgreSQL config: `SET app.profile_id = '...'`
2. RLS policies check `current_setting('app.profile_id')`
3. No JWT changes needed

**Pros**:
- ✅ Keeps RLS layer intact
- ✅ No JWT modifications

**Cons**:
- ⚠️ Very complex PostgreSQL setup
- ⚠️ Hard to debug
- ⚠️ Connection pooling complications
- ⚠️ Not portable

**Complexity**: VERY HIGH (not recommended)

---

## Recommendation: Use Option A

**Rationale**:
1. **Security**: Maintains RLS protection
2. **Scalability**: Profile context in JWT scales better than per-request validation
3. **Simplicity**: Clear separation of concerns
4. **Standard**: Custom JWT claims are Supabase best practice

**Implementation steps**:
1. Modify Supabase auth rules (or create custom auth endpoint) to issue JWT with profile_id
2. Rewrite RLS policies to check profile_id claim
3. Update frontend to fetch profiles, allow switching
4. Update backend routes to extract profile_id from JWT
5. Update service functions to filter by profile_id

---

## Timeline Estimate

| Phase | Component | Weeks | Tasks |
|-------|-----------|-------|-------|
| 1 | Database | 2-3 | Create table, migrate data, rewrite RLS |
| 2 | Backend | 3-4 | Update services, routes, security layer |
| 3 | Frontend | 2-3 | Auth store, hooks, UI, profile switcher |
| 4 | Testing | 2-3 | RLS tests, integration tests, edge cases |
| **Total** | | **9-13** | **Full feature with confidence** |

### Faster Path (if deadline critical)

Use Option B for 4 weeks, get MVP working:
1. Week 1: Add profile_id to schema
2. Week 2: Update services + routes (manual validation)
3. Week 3: Frontend auth store + profile switcher
4. Week 4: Testing + bug fixes

Then refactor to Option A over next 3-4 weeks.

---

## Risk Assessment

### Critical Risks
1. **RLS Policy Rewrite** (HIGH)
   - Complexity: SQL policies are hard to get right
   - Impact: Security vulnerability if wrong
   - Mitigation: Comprehensive test suite, security review

2. **Data Migration** (HIGH)
   - Complexity: Moving 19 tables' data
   - Impact: Data loss if migration fails
   - Mitigation: Full backup, test migration on copy, rollback plan

3. **Backward Compatibility** (MEDIUM)
   - Complexity: Existing clients expect /profiles/me
   - Impact: Breaking changes for mobile apps
   - Mitigation: Support both /me and /{id} routes during transition

### Medium Risks
1. **Performance** - Additional JOINs for profile ownership checks
2. **JWT Payload Size** - Adding profile_id increases JWT size slightly
3. **Cross-Profile Contamination** - Bug allowing access to wrong profile

### Low Risks
1. **Frontend Complexity** - Relatively straightforward state management
2. **API Route Changes** - Can be done with feature flags

---

## Questions for Stakeholders

### Scope & Requirements
1. **What profile types?**
   - Principal + children only?
   - Or include partners/spouses/shared accounts?

2. **What data is private vs shared?**
   - Each profile has own ingresos/egresos?
   - Or shared family transactions?
   - Separate categories per profile?

3. **Permissions model?**
   - Can parent see child's spending?
   - Can child see parent's spending?
   - Admin profile that manages others?

### Features
4. **Shared features?**
   - Shared budget (family-wide)?
   - Shared goals (family savings)?
   - Shared cards (multiple family members)?
   - Chore rewards/allowance system?

5. **Analytics/Reporting**
   - Individual per-profile dashboards?
   - Family combined dashboard (parents only)?

### Timeline
6. **When needed?**
   - Next quarter? Next year?
   - How many users need this initially?

7. **MVP vs Full?**
   - Start with basic separation (Option B)?
   - Full security from day one (Option A)?

---

## Conclusion

✅ **Technically Feasible**: Clean architecture makes this achievable
✅ **Clear Path Forward**: Option A (JWT claims) is well-defined approach
⚠️ **Significant Scope**: 30-40% of codebase changes needed
⚠️ **Timeline**: 9-13 weeks for production-ready implementation
🔴 **Not to Underestimate**: RLS policy rewrites and data migration are critical paths

**Recommendation**: Start with **Phase 1 (Database)** in parallel to **scope refinement** 
with stakeholders, then proceed with Phases 2-3 once profile types/permissions are defined.

