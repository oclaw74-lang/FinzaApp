# FINZA MULTI-PROFILE: QUICK REFERENCE GUIDE

## TL;DR - The One-Page Version

**Question**: Can we add multi-profile/family features to Finza?
**Answer**: Yes, but it's a significant undertaking (30-40% codebase changes, 9-13 weeks)

**Why it's hard**: Every table, every service, every route assumes one user_id per account.
**Why it's doable**: Architecture is clean, patterns are consistent.

---

## What You're Actually Changing

```
BEFORE (Current):
  User A ──auth.uid()──→ user_config(1:1)
                     ├──→ ingresos(N:1) ← 50 transactions
                     ├──→ egresos(N:1) ← 100 transactions
                     └──→ metas(N:1) ← 3 savings goals

AFTER (Multi-Profile):
  User A ──auth.uid()──→ user_config(1:1)
                     ├──→ family_profiles(1:N) ← NEW TABLE
                     │   ├──→ Profile "Principal" (Parent)
                     │   │   ├──→ ingresos(N:1)
                     │   │   ├──→ egresos(N:1)
                     │   │   └──→ metas(N:1)
                     │   └──→ Profile "Maria" (Child)
                     │       ├──→ ingresos(N:1)
                     │       ├──→ egresos(N:1)
                     │       └──→ metas(N:1)
```

---

## The Technical Approach (Recommended)

**Step 1: Add profile_id to 19 tables**
```sql
ALTER TABLE ingresos ADD COLUMN profile_id UUID;
-- Repeat for: egresos, metas, budgets, cards, loans, etc.
```

**Step 2: Rewrite 23 RLS policies**
```sql
-- Current: WHERE auth.uid() = user_id
-- New: WHERE auth.uid() = user_id AND profile_id IN (user's profiles)
```

**Step 3: Update 40+ service functions**
```python
# Current: def list_ingresos(user_jwt, user_id)
# New: def list_ingresos(user_jwt, user_id, profile_id)
```

**Step 4: Update 50+ routes**
```python
# Current: GET /ingresos (assumes user's only profile)
# New: GET /ingresos?profile_id=uuid OR X-Profile-ID header
```

**Step 5: Update frontend**
- Track activeProfileId in auth store
- Add profile switcher UI
- Update all query hooks to include profileId

---

## The Two Implementation Paths

### Path A: Secure (Recommended) - 9-13 weeks
Use **Custom JWT Claims**:
1. When user selects profile, get new JWT with `profile_id` in claims
2. RLS policies check both `user_id` AND `profile_id` from JWT
3. Zero manual validation needed (RLS is your safety net)
4. Scales perfectly, production-ready

### Path B: Fast MVP - 4-6 weeks (then refactor)
Use **Admin Client + Manual Validation**:
1. Bypass RLS, use admin client for all queries
2. Manually validate profile ownership in each service
3. Get to MVP faster
4. ⚠️ Less secure, must refactor to Path A later

---

## What Actually Changes in Code

### Backend Service (Representative Example)

**Before**:
```python
def list_ingresos(user_jwt: str, user_id: str) -> dict:
    client = get_user_client(user_jwt)
    query = client.table("ingresos").select(...).eq("user_id", user_id)
    return {"items": response.data}
```

**After**:
```python
def list_ingresos(user_jwt: str, user_id: str, profile_id: str) -> dict:
    client = get_user_client(user_jwt)
    query = (
        client.table("ingresos")
        .select(...)
        .eq("user_id", user_id)
        .eq("profile_id", profile_id)  # NEW
    )
    return {"items": response.data}
```

**Change Pattern**: Add ONE line per service function (profile_id filter)

---

### Backend Route (Representative Example)

**Before**:
```python
@router.get("/ingresos")
async def list_ingresos(
    current_user: dict = Depends(get_current_user),
    token: str = Depends(get_raw_token),
):
    return svc.list_ingresos(token, current_user["user_id"])
```

**After**:
```python
@router.get("/ingresos")
async def list_ingresos(
    profile_id: str = Header(...),  # Get from header
    current_user: dict = Depends(get_current_user),
    token: str = Depends(get_raw_token),
):
    verify_profile_ownership(profile_id, current_user["user_id"])  # Validate
    return svc.list_ingresos(token, current_user["user_id"], profile_id)  # Pass profile
```

**Change Pattern**: Add ownership check + pass profile_id to service

---

### Frontend Store (authStore.ts)

**Before**:
```typescript
const store = {
  session,    // One JWT
  user,       // One user
}
```

**After**:
```typescript
const store = {
  session,              // One JWT (but might have profile_id in claims)
  user,                 // One user
  profiles,             // NEW - list of user's profiles
  activeProfileId,      // NEW - which profile is active
  setActiveProfile,     // NEW - switch profiles
}
```

---

### Frontend Hook (useIngresos example)

**Before**:
```typescript
export function useIngresos() {
  return useQuery({
    queryKey: ['ingresos'],
    queryFn: () => api.get('/ingresos')
  })
}
```

**After**:
```typescript
export function useIngresos(profileId: UUID) {
  return useQuery({
    queryKey: ['ingresos', profileId],  // Add profile to key
    queryFn: () => api.get('/ingresos', { 
      headers: { 'X-Profile-ID': profileId }  // Pass profile
    })
  })
}
```

---

## The 23 RLS Policies That Need Rewriting

| Table | Current Policy | New Policy |
|-------|---|---|
| user_config | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| categorias | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| ingresos | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| egresos | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| prestamos | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| metas_ahorro | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| presupuestos | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| recurrentes | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| notificaciones | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| suscripciones | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| tarjetas | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| movimientos_tarjeta | `auth.uid() = user_id` | `auth.uid() = user_id AND profile_id = requested_profile` |
| *(and 11 more tables)* | | |

**Pattern**: They all follow the same theme. Rewriting them is boilerplate but critical.

---

## The 40+ Service Functions That Need Updates

**How many lines change per function?** Usually 1-3 lines added:

```python
# Line 1: Add parameter
def list_ingresos(user_jwt, user_id, profile_id):  # +1 line

# Line 2: Add filter
.eq("profile_id", profile_id)  # +1 line

# Line 3 (optional): Update create/insert
payload["profile_id"] = profile_id  # +1 line
```

**Affected Services**:
- ingresos.py: 5 functions
- egresos.py: 5 functions
- metas_ahorro.py: 7 functions
- prestamos.py: 4 functions
- presupuestos.py: 4 functions
- recurrentes.py: 4 functions
- notificaciones.py: 3 functions
- suscripciones.py: 3 functions
- *(and 6 more service files)*

---

## The 50+ Route Endpoints That Need Updates

**Per endpoint, add roughly 3 changes**:
1. Extract profile_id from header/path
2. Validate ownership
3. Pass to service

**Affected Route Files**:
- profiles.py
- ingresos.py
- egresos.py
- metas.py
- prestamos.py
- presupuestos.py
- recurrentes.py
- notificaciones.py
- suscripciones.py
- tarjetas.py
- movimientos_tarjeta.py
- *(and 8 more route files)*

---

## Timeline Breakdown

| Phase | Component | Weeks | Who | Complexity |
|-------|-----------|-------|-----|------------|
| 1 | Database schema | 2-3 | DBA/Backend | HIGH |
| 1.5 | RLS policy rewrites | 1-2 | Backend/Security | CRITICAL |
| 2 | Service layer updates | 2-3 | Backend | MEDIUM |
| 2.5 | Route handler updates | 1-2 | Backend | MEDIUM |
| 3 | Auth store + hooks | 1-2 | Frontend | MEDIUM |
| 3.5 | Profile switcher UI | 1 | Frontend | LOW |
| 4 | Integration testing | 2-3 | QA/Backend | HIGH |

**Sequential Path**: 1 → 1.5 → 2 → 2.5 → 3 → 3.5 → 4
**Total**: ~10-13 weeks

**Parallel Path**: 1 & 1.5 can overlap, 2 & 3 can overlap
**Optimized**: ~9-11 weeks with 2 full-time developers

---

## Critical Success Factors

✅ **Do these things**:
1. **Write RLS policy tests FIRST** - Test every policy with multiple profiles
2. **Create comprehensive data migration test** - Test on copy of production
3. **Use feature flags** - Roll out to beta users first
4. **Maintain backward compatibility** - Support old routes during transition
5. **Document everything** - Profile concept, RLS logic, API changes

❌ **Don't do these things**:
1. Don't bypass RLS for "speed" (security debt)
2. Don't forget to update ALL 40+ service functions
3. Don't assume RLS validates ownership (explicit checks too)
4. Don't deploy to production without staging test
5. Don't skip the integration tests

---

## Decision Matrix: Which Path?

| Factor | Path A (JWT) | Path B (Admin) |
|--------|---|---|
| **Time to MVP** | 9-13 weeks | 4-6 weeks |
| **Security** | ✅ Production-ready | ⚠️ Manual validation risk |
| **Performance** | ✅ RLS is fast | ⚠️ Manual filtering slower |
| **Technical Debt** | None | High (must refactor) |
| **Team Size** | 2-3 full-time | 1-2 full-time |
| **Risk** | Medium | Medium-High |
| **Long-term** | ✅ Best choice | Temporary bridge |

**Recommendation**: **Start with Path A** if you have 9-13 weeks.
If deadline is hard at 4 weeks, use **Path B then refactor to A**.

---

## Key Questions to Answer First

Before starting, align on these:

1. **Profile Types**
   - [ ] Parent + Children only?
   - [ ] Or Partners/Spouses too?
   - [ ] Any profile type (unlimited)?

2. **Data Sharing**
   - [ ] Completely separate data per profile?
   - [ ] Some shared features (shared budget)?
   - [ ] Shared cards (multiple people use)?

3. **Permissions**
   - [ ] Parent can see child's spending?
   - [ ] Child can see parent's spending?
   - [ ] Any admin-only features?

4. **Features**
   - [ ] Just separation (MVP)?
   - [ ] Allowances/chores system?
   - [ ] Family dashboard?

---

## Resources & Next Steps

**After reading this guide**:
1. ✅ Read FEASIBILITY_ANALYSIS.md for full technical details
2. ✅ Read FILE_REFERENCE.md to understand each file's changes
3. ✅ Align stakeholders on profile types + permissions model
4. ✅ Estimate team size and timeline
5. ✅ Decide: Path A (secure) or Path B (fast MVP)?
6. ✅ Start with **Phase 1: Database design**

**Phase 1 Deliverables**:
- [ ] family_profiles table schema
- [ ] Migration plan for 19 tables
- [ ] RLS policy test suite design
- [ ] Data migration script + rollback plan

