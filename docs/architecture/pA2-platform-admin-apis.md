# P A.2 — Platform Admin APIs

**Status:** Implemented.  
**Depends on:** [P A.1 platform admin data layer](./pA1-platform-admin-data-layer.md) (`012`–`014`).

Admin UI wired in A.3 / A.3.1. Announcements added in [P A.4](./pA4-platform-announcements.md).

---

## Authentication

All routes require a logged-in Supabase session with `profiles.platform_role` set.

| Guard | Who |
|-------|-----|
| `requirePlatformContext('staff')` | `platform_admin` or `platform_support` |
| `requirePlatformContext('admin')` | `platform_admin` only |

Normal tenant users (no `platform_role`) receive **403 FORBIDDEN**.

Unauthenticated requests receive **401 UNAUTHENTICATED**.

---

## Error codes

| Code | HTTP | When |
|------|------|------|
| `UNAUTHENTICATED` | 401 | No session / Supabase not configured |
| `FORBIDDEN` | 403 | Not platform staff, or support calling mutation |
| `NOT_FOUND` | 404 | Company missing |
| `VALIDATION` | 400 | Bad body or query |
| `RPC_ERROR` | 502 | PostgreSQL RPC failed (mapped from DB message) |
| `INTERNAL` | 500 | Unexpected error |

Response shape:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "platform_admin role required for this action",
    "details": {}
  }
}
```

---

## List query parameters

Shared by list endpoints:

| Param | Description |
|-------|-------------|
| `search` | Text search (endpoint-specific fields) |
| `status` | Company `account_status`: `active` \| `suspended` |
| `subscription_status` | `active` \| `trialing` \| `expired` \| `suspended` \| `cancelled` |
| `payment_status` | Payments only: `pending` \| `completed` \| `failed` \| `refunded` |
| `page` | 1-based page (default `1`) |
| `limit` | Page size (default `20`, max `100`) |

List response:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 42
}
```

---

## Routes

### Dashboard

| Method | Path | Access | Data source |
|--------|------|--------|-------------|
| GET | `/api/platform/dashboard` | staff | `platform_dashboard_stats()` |

Response:

```json
{
  "stats": {
    "totalCompanies": 0,
    "activeCompanies": 0,
    "trialingCompanies": 0,
    "expiredCompanies": 0,
    "suspendedCompanies": 0,
    "accountSuspendedCompanies": 0,
    "totalRevenue": 0,
    "pendingPayments": 0,
    "generatedAt": "2026-06-03T12:00:00.000Z"
  }
}
```

### Companies

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/api/platform/companies` | staff | `company_subscription_current` + filters |
| GET | `/api/platform/companies/[id]` | staff | Single company row from view |
| POST | `/api/platform/companies/[id]/status` | **admin** | RPC `platform_set_company_status` |

**POST body** (`/status`):

```json
{
  "status": "active",
  "reason": "optional note"
}
```

`status`: `active` \| `suspended`

Response:

```json
{
  "result": {
    "ok": true,
    "companyId": "uuid",
    "accountStatus": "suspended"
  }
}
```

### Subscriptions

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/api/platform/subscriptions` | staff | View rows with `subscription_id` not null |
| POST | `/api/platform/subscriptions/[companyId]/extend` | **admin** | RPC `platform_extend_subscription` |

**POST body** (`/extend`):

```json
{
  "new_expires_at": "2027-06-03T12:00:00.000Z",
  "reason": "support grant"
}
```

Response:

```json
{
  "result": {
    "ok": true,
    "subscriptionId": "uuid",
    "companyId": "uuid",
    "status": "active",
    "expiresAt": "2027-06-03T12:00:00.000Z"
  }
}
```

### Payments

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/api/platform/payments` | staff | `payments` + `companies(name)` |

### Platform actions (audit)

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/api/platform/actions` | staff | `platform_admin_actions` |

### Platform staff

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/api/platform/staff` | staff | Profiles with `platform_role` set |
| POST | `/api/platform/staff` | admin | Assign role by email (user must exist) |
| PATCH | `/api/platform/staff/[profileId]` | admin | Change role |
| DELETE | `/api/platform/staff/[profileId]` | admin | Remove platform access |

See [pA6-platform-staff-management.md](./pA6-platform-staff-management.md).

---

## Permission matrix

| Endpoint | platform_admin | platform_support | Tenant user |
|----------|----------------|------------------|-------------|
| GET dashboard | ✅ | ✅ | ❌ |
| GET companies / [id] | ✅ | ✅ | ❌ |
| POST company status | ✅ | ❌ 403 | ❌ |
| GET subscriptions | ✅ | ✅ | ❌ |
| POST extend subscription | ✅ | ❌ 403 | ❌ |
| GET payments | ✅ | ✅ | ❌ |
| GET actions | ✅ | ✅ | ❌ |
| GET staff | ✅ | ✅ | ❌ |
| POST/PATCH/DELETE staff | ✅ | ❌ 403 | ❌ |

---

## Application layout

```
src/lib/auth/require-platform.ts
src/application/platform/          # use-cases, schemas, query parser
src/infrastructure/supabase/repositories/platform/
src/app/api/platform/            # route handlers
```

---

## Example (curl)

```bash
# Dashboard (platform admin session cookie)
curl -b "your-cookies" http://localhost:3000/api/platform/dashboard

# List trialing companies
curl -b "your-cookies" "http://localhost:3000/api/platform/companies?subscription_status=trialing&page=1&limit=20"

# Suspend company (admin only)
curl -X POST -b "your-cookies" -H "Content-Type: application/json" \
  -d '{"status":"suspended","reason":"abuse"}' \
  http://localhost:3000/api/platform/companies/COMPANY_UUID/status
```

---

## Next: P A.3 — Admin UI ✅

Core admin pages wired to these APIs. See blueprint Phase A.3.

Still on mock data (out of A.3 scope): `/admin/messages`, `/admin/settings`, chart time-series in `admin-charts.tsx` (revenue/growth — removed from overview).
