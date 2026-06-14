# P A.1 — Platform Admin Data Layer

**Status:** Implemented (`012`–`014`).  
**Scope:** Schema, view, RPCs, RLS only — no `/api/platform/*`, no admin UI.

---

## Migrations

| File | Purpose |
|------|---------|
| `012_pA1_company_account_status.sql` | `company_account_status` enum + `companies` suspend columns |
| `013_pA1_platform_admin_actions.sql` | `platform_admin_actions` audit table + RLS |
| `014_pA1_platform_views_rpcs_rls.sql` | View, RPCs, `is_platform_staff()`, activity_logs RLS fix |
| `018_pA1_company_subscription_current_security_invoker.sql` | View `security_invoker = true` (RLS parity fix) |

---

## 1. Company account status

```sql
company_account_status: active | suspended
```

| Column | Type | Notes |
|--------|------|--------|
| `account_status` | enum | Default `active` |
| `suspended_at` | timestamptz | Set on suspend |
| `suspended_by` | uuid → profiles | Platform admin who suspended |
| `suspension_reason` | text | Optional internal note |

**Separate from** `subscriptions.status` (billing lifecycle). Tenant app blocking is enforced in application layer (A.2+), not only DB.

---

## 2. Platform admin actions

Immutable audit for platform interventions.

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `admin_user_id` | uuid → profiles |
| `action` | text |
| `entity_type` | text |
| `entity_id` | uuid |
| `metadata` | jsonb |
| `created_at` | timestamptz |

**Example actions:** `company.status_changed`, `subscription.extended`

**Writes:** Only via `SECURITY DEFINER` RPCs (direct client INSERT denied by RLS).

**Reads:** `platform_admin` and `platform_support`.

---

## 3. View: `company_subscription_current`

One row per company — latest subscription by `created_at DESC`.

| Output | Source |
|--------|--------|
| Company | `companies` + owner email |
| `account_status` | `companies` |
| Subscription status, plan, dates | Latest `subscriptions` |
| `users_count` | `company_members` |
| `documents_count` | receipts + payments + invoices |
| `latest_activity_at` | `MAX(activity_logs.created_at)` |

```sql
SELECT * FROM company_subscription_current ORDER BY company_created_at DESC;
```

Granted to `authenticated`. The view uses **`security_invoker = true`** (migration `018`) so row access is enforced by RLS on underlying tables — not by view-owner bypass.

| Caller | Effective access |
|--------|------------------|
| `platform_admin` / `platform_support` | All companies (RLS OR clauses on `companies`, `subscriptions`, documents, etc.) |
| Regular tenant | Only rows for `company_id IN user_company_ids()` — no cross-tenant platform metrics |

**Why Security Advisor flagged “Security Definer View”:** views owned by `postgres` default to running as the owner, which bypasses RLS. That was never intentional; the view was not given an explicit `SECURITY DEFINER` attribute — it inherited owner privileges. **`security_invoker` is required for the documented RLS model; it is not optional.**

**Application access:** consumed only via platform admin APIs (`PlatformRepository` → `/api/platform/companies`, `/api/platform/subscriptions`, `/api/platform/companies/[id]`) and internally by `platform_dashboard_stats()` (which checks `is_platform_staff()` before querying). Tenants must not use this view for product features; direct Supabase client queries are limited to their own company row(s) by RLS.

---

## 4. RPCs

### `platform_set_company_status(company_id, status, reason?)`

- **Role:** `platform_admin` only  
- **Effect:** Updates `companies.account_status` + suspend metadata  
- **Audit:** `company.status_changed`  
- **Returns:** `{ ok, company_id, account_status }`

### `platform_extend_subscription(company_id, new_expires_at, reason?)`

- **Role:** `platform_admin` only  
- **Validation:** `new_expires_at` must be in the future  
- **Effect:** Updates latest subscription `expires_at`, `next_renewal_at`; sets `active` if was `expired` or `trialing`  
- **Audit:** `subscription.extended`  
- **Returns:** `{ ok, subscription_id, company_id, status, expires_at }`

### `platform_dashboard_stats()`

- **Role:** `platform_admin` or `platform_support`  
- **Returns JSONB:**

| Key | Definition |
|-----|------------|
| `total_companies` | All companies |
| `active_companies` | `account_status = active` AND `subscription_status = active` |
| `trialing_companies` | Current sub `trialing` |
| `expired_companies` | Current sub `expired` |
| `suspended_companies` | Account suspended OR sub `suspended` |
| `account_suspended_companies` | Account status only |
| `total_revenue` | `SUM(payments.amount)` where `completed` |
| `pending_payments` | Count `pending` payments |
| `generated_at` | Timestamp |

---

## 5. RLS & helpers

### `is_platform_staff()`

`is_platform_admin() OR is_platform_support()` — for read-side checks in RPCs/policies.

### `platform_admin_actions`

| Operation | Policy |
|-----------|--------|
| SELECT | Platform admin + support |
| INSERT/UPDATE/DELETE | Denied (RPC only) |

### `activity_logs` (fix)

SELECT now includes `is_platform_support()` (was admin-only in `005`).

### Existing tenant tables

No change to subscription/payment write policies (still service-role / webhook only). Platform **mutations** on companies/subscriptions go through RPCs above.

---

## 6. Manual verification (SQL)

```sql
-- Assign platform admin (run as superuser in SQL editor)
UPDATE profiles SET platform_role = 'platform_admin' WHERE email = 'you@example.com';

-- Dashboard KPIs (as platform user via Supabase client with user JWT)
SELECT platform_dashboard_stats();

-- Company list
SELECT company_id, company_name, account_status, subscription_status, plan_code, users_count, latest_activity_at
FROM company_subscription_current
LIMIT 20;

-- Suspend (admin JWT)
SELECT platform_set_company_status(
  '<company_uuid>'::uuid,
  'suspended',
  'QA test suspend'
);

-- Extend (admin JWT)
SELECT platform_extend_subscription(
  '<company_uuid>'::uuid,
  NOW() + INTERVAL '1 year',
  'QA manual extension'
);

-- Audit trail
SELECT * FROM platform_admin_actions ORDER BY created_at DESC LIMIT 10;
```

---

## Next: P A.2 — Admin APIs ✅

See [pA2-platform-admin-apis.md](./pA2-platform-admin-apis.md).

## Next: P A.3 — Admin UI

Wire `/admin` pages to platform APIs (replace mock data).

See [platform-admin-phase-a-blueprint.md](./platform-admin-phase-a-blueprint.md).
