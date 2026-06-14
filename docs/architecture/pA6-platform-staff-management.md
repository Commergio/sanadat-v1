# P A.6 — Platform Staff Management

**Status:** Implemented (`019`).  
**Scope:** Assign / change / remove `profiles.platform_role` for internal Commergio/Sanadat team. No Auth user creation in this phase.

---

## Two role systems (do not mix)

| Layer | Storage | Values | Console |
|-------|---------|--------|---------|
| **Tenant roles** | `company_members.role` | `owner`, `admin`, `accountant`, `viewer` | `/ar/dashboard` |
| **Platform roles** | `profiles.platform_role` | `platform_admin`, `platform_support`, `NULL` | `/ar/admin` |

A user can be both a tenant **owner** and `platform_support`. Tenant membership does not grant `/admin` access; only `profiles.platform_role` does.

---

## Database review (migration `004` + `019`)

| Item | Status |
|------|--------|
| `platform_role` enum | `platform_admin` \| `platform_support` (004) |
| Nullable column | `profiles.platform_role` NULL for normal tenants |
| Staff mutations | `SECURITY DEFINER` RPCs only (profiles UPDATE RLS is own-row only) |
| Last admin guard | RPCs block demote/remove when only one `platform_admin` remains |

No enum change required for P A.6.

---

## RPCs (`019_pA6_platform_staff_management.sql`)

| RPC | Role | Action |
|-----|------|--------|
| `platform_add_staff(email, role)` | `platform_admin` | Find profile by email → set `platform_role` |
| `platform_change_staff_role(profile_id, role)` | `platform_admin` | Change role; protect last admin |
| `platform_remove_staff(profile_id)` | `platform_admin` | Set `platform_role = NULL`; protect last admin |

**If email not registered:**

`User must register first before being assigned as platform staff.`

**Last admin errors:**

`Cannot remove the last platform admin`

---

## Audit (`platform_admin_actions`)

| Action | When |
|--------|------|
| `platform_staff.added` | POST add staff |
| `platform_staff.role_changed` | PATCH change role |
| `platform_staff.removed` | DELETE remove access |

Metadata: `target_profile_id`, `target_email`, `old_role`, `new_role`, `actor_admin_id`.

---

## APIs

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/api/platform/staff` | staff | List `platform_role IS NOT NULL` |
| POST | `/api/platform/staff` | admin | Add staff by email |
| PATCH | `/api/platform/staff/[profileId]` | admin | Change role |
| DELETE | `/api/platform/staff/[profileId]` | admin | Remove platform access |

List uses authenticated Supabase client + RLS (platform staff can SELECT profiles).

---

## UI

| Route | Feature |
|-------|---------|
| `/ar/admin/staff` | Staff list, search, add, change role, remove |
| `/en/admin/staff` | Same (English labels) |

- `platform_admin`: full CRUD
- `platform_support`: read-only + `AdminReadOnlyHint`
- Normal tenant (`platform_role` NULL): middleware redirects away from `/admin`

---

## Bootstrap: first platform admin

Before any staff UI exists, promote the first admin via Supabase SQL (superuser):

```sql
UPDATE profiles
SET platform_role = 'platform_admin'
WHERE email = 'you@commergio.com';
```

Then use **موظفو المنصة** / **Platform Staff** to add support users by email.

---

## Access flow

1. User registers at `/register` → tenant profile with `platform_role = NULL`.
2. Existing `platform_admin` opens `/admin/staff`, enters email, selects role.
3. Target user signs in → middleware detects `platform_role` → `/admin` allowed.
4. Removing staff sets `platform_role = NULL` → user keeps tenant dashboard access only.

---

## Related docs

- [p0-auth-tenant.md](./p0-auth-tenant.md) — auth & platform vs tenant
- [pA2-platform-admin-apis.md](./pA2-platform-admin-apis.md) — platform API index
- [pA1-platform-admin-data-layer.md](./pA1-platform-admin-data-layer.md) — audit table & RPC patterns
