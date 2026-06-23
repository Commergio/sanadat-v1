# Admin operations guide

Operations runbook for Sanadat **platform** staff (`platform_admin`, `platform_support`). Tenant users manage their own companies from `/dashboard`.

Access: `https://your-domain.com/ar/admin` (or `/en/admin`).

---

## Roles

| Role | Access |
|------|--------|
| `platform_admin` | Full read/write — companies, subscriptions, coupons, invitation codes, announcements, staff, tickets |
| `platform_support` | Read-mostly + support tickets; cannot suspend companies, extend subs, manage coupons, or manage invitation codes |

Middleware allows both roles on `/admin`; destructive actions require `platform_admin` in API layer.

---

## Bootstrap: first platform admin

**Prerequisite:** User must already have registered (exists in `auth.users` + `profiles`).

### Option A — SQL (Supabase SQL Editor)

```sql
UPDATE profiles
SET platform_role = 'platform_admin'
WHERE email = 'you@company.com';
```

Migration `004` may seed a bootstrap admin if configured at project creation — verify `profiles` table.

### Option B — existing admin adds staff

1. Sign in as `platform_admin`
2. Go to **Admin → Staff** (`/admin/staff`)
3. Enter registered user email
4. Select role → **Add**

RPC: `platform_add_staff(email, role)` — see migration `019`.

**Last admin guard:** Cannot demote or remove the only remaining `platform_admin`.

---

## Create platform support

Same as above with role **Platform support** (`platform_support`).

Support can:
- View companies, subscriptions, payments, tickets
- View bank transfer review queue (read-only)
- Reply to support tickets
- View announcements

Support cannot:
- Suspend companies
- Extend subscriptions
- Approve or reject bank transfers
- Create/edit/delete coupons
- Create/edit/delete invitation codes
- Publish announcements
- Manage platform staff

---

## Manage companies

**Path:** Admin → Clients (`/admin/clients`)

| Action | Who | How |
|--------|-----|-----|
| Search / filter | Admin, Support | UI list |
| View company detail | Admin, Support | Click company row |
| View documents count, subscription, users | Admin, Support | Detail tabs |

Company data is tenant-owned; platform staff do not edit tenant documents directly in v1.

---

## Suspend / reactivate company

**Who:** `platform_admin` only

**Path:** Company detail → Account status

| Status | Effect |
|--------|--------|
| `active` | Normal operation |
| `suspended` | Tenant users blocked from dashboard actions (per RLS/app checks) |

**API:** `POST /api/platform/companies/[id]/status`  
**RPC:** `platform_set_company_status`  
**Audit:** Row in `platform_admin_actions` (`company.status_changed`)

Always record reason in internal notes when suspending.

---

## Extend subscription

**Who:** `platform_admin` only

**Path:** Admin → Subscriptions → company → Extend

**API:** `POST /api/platform/subscriptions/[companyId]/extend`

Provide:
- New expiry date (or extension days per UI)
- Reason (logged in `platform_admin_actions`)

Use for support overrides when Moyasar webhook failed or goodwill extension.

---

## Review bank transfer payments

**Who:** `platform_admin` approves/rejects; `platform_support` can view only

**Path:** Admin → Bank transfers (`/admin/manual-payments`)

Tenants upload a transfer receipt from **Dashboard → Subscription** (`/dashboard/subscription`) under **Bank transfer payment**. Only company **owner/admin** can submit; accountant/viewer see read-only status.

### Review workflow

1. Open **Bank transfers** and filter by **Pending**
2. Click **Review** on a request
3. Open **View / download receipt** (signed URL — raw storage paths are never exposed)
4. Verify amount (399 SAR), company, and transfer details match the receipt
5. **Approve and activate subscription** — or **Reject** with a required reason

### What approval does

| Step | Effect |
|------|--------|
| `manual_payment_requests.status` | Set to `approved` |
| `payments` row | Created with `gateway = manual`, `status = completed` |
| Subscription | Activated or extended (same logic as successful Moyasar payment) |
| Activity log | `billing.manual_payment_approved` for the tenant |
| Platform audit | `manual_payment.approved` in `platform_admin_actions` |

### What rejection does

| Step | Effect |
|------|--------|
| `manual_payment_requests.status` | Set to `rejected` with `admin_note` |
| Subscription | **Not** changed |
| Activity log | `billing.manual_payment_rejected` |
| Platform audit | `manual_payment.rejected` |

**APIs:**

- `GET /api/platform/manual-payments` — list (filter: `status=pending|approved|rejected`)
- `GET /api/platform/manual-payments/[id]` — detail + signed `proofUrl`
- `POST /api/platform/manual-payments/[id]/approve` — admin only
- `POST /api/platform/manual-payments/[id]/reject` — admin only, body: `{ "admin_note": "..." }`

**Storage:** Private bucket `payment-proofs` (PDF/PNG/JPG, max 5 MB). Upload via `POST /api/billing/manual-payment` (service role).

Only one **pending** request per company is allowed at a time.

---

## Create & manage coupons

**Who:** `platform_admin` only (support: read-only)

**Path:** Admin → Coupons (`/admin/coupons`)

| Field | Notes |
|-------|-------|
| Code | Uppercase, unique |
| Discount | Percent or fixed SAR |
| Valid from / until | Optional window |
| Max redemptions | Optional cap |
| Active | Toggle |

**API:** `/api/platform/coupons` (CRUD)

Tenants apply coupons at subscription checkout (`/dashboard/subscription`).

**Audit:** `coupon.created`, `coupon.updated`, `coupon.deleted` in `platform_admin_actions`.

> **Not the same as invitation codes:** Discount coupons reduce checkout price at Moyasar payment. Invitation promo codes grant **free active subscription access** for a fixed number of days with **no payment row**.

---

## Create & manage invitation codes

**Who:** `platform_admin` only (support: read-only)

**Path:** Admin → Invitation codes (`/ar/admin/invitation-codes` or `/en/admin/invitation-codes`)

| Field | Notes |
|-------|-------|
| Code | Uppercase, unique, case-insensitive at redemption |
| Duration (days) | e.g. `90` for ~3 months free access |
| Valid from / until | Optional window when code can be redeemed |
| Max redemptions | Optional global cap |
| Per company limit | Default `1` — prevents duplicate abuse |
| Active | Toggle to deactivate without deleting |

**API:** `/api/platform/invitation-codes` (CRUD)

### Grant 3 months free access

1. Create code with `duration_days = 90` (or `91`/`92` as needed)
2. Share code with the company owner/admin
3. Tenant applies at **Dashboard → Subscription** (`POST /api/billing/invitation-code/apply`) or enters code at registration (stored until subscription page)
4. Subscription becomes `status = active`, `subscription_source = promo`, `expires_at = now + duration_days`
5. **No payment** is created

### After promo expiry

Expiry is enforced by existing subscription status checks (no separate cron in P2.8). When `expires_at` passes, normal expiry logic applies — the company must subscribe via Moyasar or approved bank transfer to continue. Trial document limits do **not** apply while `active` + `promo`; they apply only when `status = trialing`.

**Audit:** `invitation_code.created`, `invitation_code.updated`, `invitation_code.deleted` in `platform_admin_actions`. Tenant activity: `promo_code.applied`.

---

## Publish announcement

**Who:** `platform_admin` only

**Path:** Admin → Announcements (`/admin/announcements`)

1. Create announcement (title AR/EN, body AR/EN)
2. Set severity (info / warning / critical)
3. Set publish window (starts_at, ends_at)
4. Publish → tenants see banner in dashboard

**API:** `/api/platform/announcements`

Tenants mark read via `/api/announcements/[id]/read`.

---

## Manage support tickets

**Who:** `platform_admin` and `platform_support`

**Path:** Admin → Support (`/admin/support`)

| Action | Notes |
|--------|-------|
| List open tickets | Filter by status/priority |
| Open ticket | View tenant conversation |
| Reply | Visible to tenant |
| Change status | open → in_progress → resolved → closed |
| Assign | Optional assignee |
| Internal notes | Admin-only (if enabled in UI) |

**API:** `/api/platform/support/tickets`

Tenants create tickets at `/dashboard/support`.

---

## Platform staff management

**Path:** Admin → Staff (`/admin/staff`)

| Action | RPC |
|--------|-----|
| Add staff by email | `platform_add_staff` |
| Change role | `platform_change_staff_role` |
| Remove platform role | `platform_remove_staff` |

All actions audit to `platform_admin_actions`.

---

## Audit trail

**Path:** Admin → Actions (`/admin/actions`)  
**Table:** `platform_admin_actions`

Review after sensitive operations: suspend, extend, coupon changes, staff changes.

---

## Emergency contacts

| Issue | Action |
|-------|--------|
| Service role leaked | Rotate in Supabase + Vercel immediately |
| Moyasar webhook down | Manual extend subscription + replay webhook from Moyasar dashboard |
| Mass bad announcement | Unpublish or set `ends_at` to past in SQL/admin UI |

---

## Related docs

- [Production env checklist](./production-env-checklist.md)
- [QA checklist](./qa-checklist.md)
- [Platform admin blueprint](../architecture/platform-admin-phase-a-blueprint.md)
