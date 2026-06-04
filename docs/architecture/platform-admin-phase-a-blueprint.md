# Platform Admin Phase A — Implementation Blueprint

**Status:** Phase A.1 data layer + Phase A.2 APIs implemented. See [pA1-platform-admin-data-layer.md](./pA1-platform-admin-data-layer.md) and [pA2-platform-admin-apis.md](./pA2-platform-admin-apis.md). Admin UI not started.  
**Audience:** Sanadat platform operators (`platform_admin`, `platform_support`).  
**Scope:** Internal admin console at `/[locale]/admin/*` — separate from tenant dashboard.

---

## 0. Current state (as of P2.4.1)

### What exists in schema

| Asset | Location | Notes |
|-------|----------|--------|
| `profiles.platform_role` | `004_p0_multi_tenant_schema.sql` | `platform_admin` \| `platform_support` \| `NULL` |
| `companies` | `001` + `004` | `owner_id`, legacy `user_id`, profile fields |
| `company_members` | `004` | Tenant roles: owner/admin/accountant/viewer |
| `subscriptions` | `001` + `010` | `active`, `expired`, `suspended`, `trialing`, `cancelled`; `plan_code`, `billing_cycle`, `next_renewal_at`, cancel fields |
| `payments` | `001` + `010` | Billing journal; tenant read-only; mutations via service role |
| `activity_logs` | `001` | Tenant-scoped audit (`company_id`, `user_id`, `action`, `entity_type`, `entity_id`) |
| RLS helpers | `005` | `is_platform_admin()`, `is_platform_support()`, `user_company_ids()` |

### What exists in application

| Area | State |
|------|--------|
| `/admin` routes | UI shell: overview, clients, subscriptions, payments, messages, settings, analytics, notifications, whatsapp |
| Data | **100% mock** (`src/lib/mock-admin-data.ts`) |
| Middleware | `/admin` allowed only for `platform_role = platform_admin` (support **blocked**) |
| APIs | **No** `/api/platform/*` routes |
| Billing admin | P2 tenant billing only; platform cannot yet extend/suspend via API |

### Gaps this blueprint closes

- Real cross-tenant queries and mutations (service role + platform use cases).
- `platform_support` route access with limited permissions.
- Company operational status vs subscription billing status.
- Announcements, CMS content, support tickets (new tables).
- Immutable audit of platform interventions (`platform_admin_actions`).
- Replace mock admin pages incrementally per implementation phases.

---

## 1. Platform Admin Dashboard

**Route:** `/[locale]/admin`  
**Purpose:** At-a-glance platform health and recent cross-tenant events.

### KPI cards

| Metric | Definition | Source |
|--------|------------|--------|
| Total companies | `COUNT(companies)` | `companies` |
| Active companies | Latest subscription `status = 'active'` AND `companies.account_status = 'active'` (see §9) | `subscriptions` + `companies` |
| Trialing companies | Latest subscription `status = 'trialing'` | `subscriptions` |
| Expired companies | Latest subscription `status = 'expired'` | `subscriptions` |
| Suspended companies | `companies.account_status = 'suspended'` OR subscription `status = 'suspended'` (show both breakdown in tooltip) | `companies` + `subscriptions` |
| Total revenue | `SUM(payments.amount) WHERE status = 'completed'` (all time or rolling 30d — **spec: all-time + MTD**) | `payments` |
| Pending payments | `COUNT(*) WHERE status = 'pending'` | `payments` |
| Recent platform activity | Last 20 events (see below) | `activity_logs` + `platform_admin_actions` |

### “Latest subscription per company” rule

Admin metrics must use **one row per company**: the subscription with `ORDER BY created_at DESC LIMIT 1`, or a materialized view `company_subscription_current` (recommended in Admin Data Layer phase).

### Recent activity feed

Union two sources, sorted by `created_at DESC`:

1. **Tenant audit** — `activity_logs` where `action` IN (`billing.payment_completed`, `billing.payment_failed`, `document.created`, `document.cancelled`, `team.*`).
2. **Platform audit** — `platform_admin_actions` (manual extend, suspend, announcement publish, ticket assign, etc.).

Display: company name, action label (i18n), actor (platform user email or tenant user), relative time.

### Charts (optional v1)

Keep existing chart placeholders but wire to real aggregates:

- Client growth: companies created per month (last 6 months).
- Revenue: completed payments per month.
- Subscription breakdown: donut by `subscription.status` (current row per company).

### Access

| Role | Dashboard |
|------|-----------|
| `platform_admin` | Full KPIs + activity |
| `platform_support` | Same KPIs (read-only); no destructive quick actions |

---

## 2. Companies Management

**Routes:**

- `/[locale]/admin/companies` — list (rename from `clients` in UI copy; URL can alias `/admin/clients` → redirect).
- `/[locale]/admin/companies/[id]` — profile detail.

### List columns

| Column | Source |
|--------|--------|
| Company name | `companies.name` |
| Owner email | `profiles.email` via `companies.owner_id` |
| Subscription status | current subscription `status` |
| Account status | `companies.account_status` |
| Users count | `COUNT(company_members)` |
| Documents count | `COUNT(receipt_vouchers) + COUNT(payment_vouchers) + COUNT(invoices)` or `documents` registry when available |
| Last activity | `MAX(activity_logs.created_at)` for `company_id` |
| Created at | `companies.created_at` |

### Search & filters

- **Search:** name, email, phone, CR number (`ILIKE`).
- **Filters:** subscription status, account status, created date range, expiring within N days (`expires_at` / `next_renewal_at`).

### Company profile tabs

1. **Overview** — company fields, owner, subscription summary, quick stats.
2. **Members** — read-only list from `company_members` + emails.
3. **Subscription** — current plan, dates, link to manual actions.
4. **Payments** — last 10 billing payments for company.
5. **Activity** — paginated `activity_logs` for company.
6. **Support** — tickets linked to `company_id` (Phase Support).

### Actions (platform_admin only)

| Action | Effect | Audit |
|--------|--------|-------|
| Suspend company | `companies.account_status = 'suspended'`; optionally set subscription `status = 'suspended'` | `platform_admin_actions` + optional tenant notification |
| Reactivate company | `account_status = 'active'`; subscription unchanged unless operator also extends | same |
| Extend subscription manually | Service-role RPC: extend `expires_at` / `next_renewal_at` by N days or to date; set `active` if was `expired` | `platform.admin.subscription_extended` |

**Suspend semantics (decision):**

- **Account suspend** blocks tenant write operations (middleware + use cases check `account_status`).
- **Subscription suspend** is billing state (existing enum); platform may set both on abuse, or only account for support cases.

### Access

| Role | List / view | Suspend / extend |
|------|-------------|------------------|
| `platform_admin` | Yes | Yes |
| `platform_support` | Yes | No (read-only + internal notes on tickets) |

---

## 3. Subscriptions Management

**Route:** `/[locale]/admin/subscriptions`

### List columns

| Column | Notes |
|--------|--------|
| Company | name + link |
| Status | `active` \| `trialing` \| `expired` \| `suspended` \| `cancelled` |
| Plan | `plan_code` |
| Billing cycle | `billing_cycle` |
| Amount / currency | `amount`, `currency` |
| Starts at | `starts_at` |
| Expires at | `expires_at` |
| Next renewal | `next_renewal_at` |
| Cancel at period end | `cancel_at_period_end` |
| Auto renew | `auto_renew` |

### Filters

Status chips + plan + expiring in 7/30 days + `cancel_at_period_end = true`.

### Actions (platform_admin)

| Action | Behavior |
|--------|----------|
| Manual extension | Modal: +30 / +90 / +365 days or custom date → updates `expires_at`, `next_renewal_at`; may set `status = active` |
| Cancel at period end | `cancel_at_period_end = true`, `cancelled_by = platform user` |
| Immediate cancel | `status = cancelled`, `cancelled_at = now()` |
| Reactivate | `status = active`, clear cancel flags, extend if expired |

All mutations via **`SECURITY DEFINER` RPC** or service-role repository (never client-side Supabase update on `subscriptions` — RLS blocks tenant UPDATE).

### Relationship to tenant billing (P2)

- Tenant checkout/webhook remains primary activation path.
- Platform manual extension is **override** for support; log reason in `platform_admin_actions.payload`.

---

## 4. Payments Management

**Route:** `/[locale]/admin/payments`

### List columns

| Column | Field |
|--------|--------|
| Company | `company_id` → name |
| Amount | `amount` |
| Currency | `currency` |
| Status | `pending` \| `completed` \| `failed` \| `refunded` |
| Gateway | `gateway` (incl. `manual`) |
| Paid at | `paid_at` |
| Failed at | `failed_at` |
| Created at | `created_at` |
| Gateway reference | `gateway_reference` |
| Checkout session | `checkout_session_id` |
| Provider event | `provider_event_id` |

### Filters

Status, gateway, date range, company search, amount range.

### Actions

| Role | Capability |
|------|------------|
| `platform_admin` | View detail, export CSV (later), **no** arbitrary status edit in v1 (preserve webhook journal integrity) |
| `platform_support` | Read-only |

**Future:** “Mark failed” / refund only via dedicated RPC with audit — out of Phase A implementation.

---

## 5. Announcements Management

**Routes:**

- `/[locale]/admin/announcements`
- `/[locale]/admin/announcements/new`
- `/[locale]/admin/announcements/[id]/edit`

### Tenant visibility

- Banner/card on tenant dashboard (`DashboardHome` top) when:
  - `published = true`
  - `now() BETWEEN start_at AND end_at` (or `end_at IS NULL`)
  - Target includes user’s active `company_id` (all companies OR row in `announcement_targets`).

### Admin fields

| Field | Type | Notes |
|-------|------|--------|
| `title` | text | AR required; EN optional column or JSONB `title_i18n` |
| `content` | text / markdown | Rich text phase 2 |
| `priority` | enum | `low` \| `normal` \| `high` \| `critical` (sort order) |
| `start_at` | timestamptz | |
| `end_at` | timestamptz nullable | |
| `published` | boolean | |
| `target_mode` | enum | `all` \| `specific` |
| `created_by` | uuid | platform profile |

### Targeting

- `all` — every company sees it.
- `specific` — junction `announcement_targets(announcement_id, company_id)`.

### Actions

Create, edit, publish, unpublish, archive (soft delete).

### Access

| Role | CRUD |
|------|------|
| `platform_admin` | Full |
| `platform_support` | Read-only (optional: draft suggestions — defer) |

---

## 6. Content Management

**Route:** `/[locale]/admin/content` with sub-routes or tabs:

| Type | Slug examples | Tenant surface |
|------|---------------|----------------|
| `system_update` | maintenance Dec 2026 | Dashboard notice / settings |
| `help_article` | how-to-receipt | Help center `/dashboard/help/[slug]` |
| `tutorial` | onboarding-v2 | Linked from onboarding |
| `release_note` | v1.2.0 | Dashboard “What’s new” modal |

### Shared model (`content_posts`)

| Field | Notes |
|-------|--------|
| `type` | enum above |
| `slug` | unique per type |
| `title`, `body` | i18n JSONB recommended: `{ "ar": "...", "en": "..." }` |
| `status` | `draft` \| `published` \| `archived` |
| `published_at` | |
| `author_id` | platform profile |
| `tags` | text[] optional |
| `sort_order` | for help nav |

### Access

Same as announcements: admin full, support read-only.

---

## 7. Support Center

**Routes:**

- `/[locale]/admin/support` — ticket queue
- `/[locale]/admin/support/[id]` — ticket detail

### Ticket model (`support_tickets`)

| Field | Notes |
|-------|--------|
| `company_id` | required FK |
| `created_by_profile_id` | tenant user who opened (nullable if phone/email intake later) |
| `subject` | |
| `status` | `open` \| `in_progress` \| `waiting_customer` \| `resolved` \| `closed` |
| `priority` | `low` \| `normal` \| `high` \| `urgent` |
| `assigned_to` | `profiles.id` (platform staff) |
| `category` | optional enum: billing, documents, account, other |

### Internal notes (`support_ticket_notes`)

| Field | Notes |
|-------|--------|
| `ticket_id` | |
| `author_id` | platform profile |
| `body` | |
| `is_internal` | default true (never shown to tenant in v1) |

### Tenant-facing (later phase)

Optional `support_tickets` created from dashboard “Contact support” — Phase Support UI.

### Access

| Role | Tickets | Assign | Internal notes | Change status |
|------|---------|--------|----------------|---------------|
| `platform_admin` | All | Yes | Yes | Yes |
| `platform_support` | All | Self-assign | Yes | Yes (not delete company) |

---

## 8. Roles and Security

### Role matrix

| Capability | `platform_admin` | `platform_support` | Tenant users |
|------------|------------------|--------------------|--------------|
| Access `/admin` | Yes | Yes (subset of nav) | No (middleware redirect) |
| Dashboard KPIs | Read | Read | — |
| Companies list/detail | Read | Read | Own company only |
| Suspend / reactivate company | Yes | No | No |
| Manual subscription extend/cancel | Yes | No | No |
| Subscriptions list | Read | Read | Own subscription |
| Payments list | Read | Read | Own payments |
| Announcements CRUD | Yes | Read | Read published targets only |
| Content CMS | Yes | Read | Read published posts only |
| Support tickets | Full | Operate (no billing overrides) | Create own (future) |
| `profiles.platform_role` assign | Super-admin only (SQL) | No | No |
| `activity_logs` all tenants | Read | Read (add RLS parity) | Own company |
| Service role / webhooks | Yes (server) | No | No |

### Middleware changes (planned)

```text
/admin/*  →  platform_role IN ('platform_admin', 'platform_support')
/admin/settings/security  →  platform_admin only (optional)
```

Use route-level guard map:

```typescript
const PLATFORM_ROUTE_ROLES: Record<string, PlatformRole[]> = {
  "/admin/companies": ["platform_admin", "platform_support"],
  "/admin/announcements/new": ["platform_admin"],
  // ...
};
```

### Application layer

- `requirePlatformContext(minRole: 'support' | 'admin')` — loads `profiles.platform_role`, user id, email.
- `assertPlatformAdmin()` for mutations.
- All platform writes go through **service role** repositories after role check (same pattern as P2 billing).

### Authentication note

Platform roles are on `profiles`, not `company_members`. A user can be both tenant owner and `platform_admin` — admin console uses separate layout; active company cookie irrelevant on `/admin`.

---

## 9. Required database migrations

**Suggested migration series:** `012_platform_admin_foundation.sql` … `015_platform_support_rls.sql`

### 9.1 `companies.account_status` (new)

```sql
CREATE TYPE company_account_status AS ENUM ('active', 'suspended');

ALTER TABLE companies
  ADD COLUMN account_status company_account_status NOT NULL DEFAULT 'active',
  ADD COLUMN suspended_at TIMESTAMPTZ,
  ADD COLUMN suspended_by UUID REFERENCES profiles(id),
  ADD COLUMN suspension_reason TEXT;
```

Index: `(account_status)` WHERE `account_status = 'suspended'`.

### 9.2 `platform_admin_actions` (audit)

```sql
CREATE TABLE platform_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,  -- e.g. company.suspended, subscription.extended
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  company_id UUID REFERENCES companies(id),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_platform_admin_actions_created ON platform_admin_actions (created_at DESC);
CREATE INDEX idx_platform_admin_actions_company ON platform_admin_actions (company_id);
```

No tenant SELECT policy (platform only). Inserts via service role or `SECURITY DEFINER`.

### 9.3 `announcements` + `announcement_targets`

```sql
CREATE TYPE announcement_priority AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE announcement_target_mode AS ENUM ('all', 'specific');

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  title_i18n JSONB,
  content_i18n JSONB,
  priority announcement_priority NOT NULL DEFAULT 'normal',
  target_mode announcement_target_mode NOT NULL DEFAULT 'all',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE announcement_targets (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (announcement_id, company_id)
);

CREATE TABLE announcement_reads (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);
```

### 9.4 `content_posts`

```sql
CREATE TYPE content_post_type AS ENUM ('system_update', 'help_article', 'tutorial', 'release_note');
CREATE TYPE content_post_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type content_post_type NOT NULL,
  slug TEXT NOT NULL,
  title_i18n JSONB NOT NULL,
  body_i18n JSONB NOT NULL,
  status content_post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  author_id UUID NOT NULL REFERENCES profiles(id),
  tags TEXT[] DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, slug)
);
```

### 9.5 `support_tickets` + `support_ticket_notes`

```sql
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
CREATE TYPE support_ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by_profile_id UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  priority support_ticket_priority NOT NULL DEFAULT 'normal',
  category TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE support_ticket_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 9.6 RPC / views (Admin Data Layer)

| Object | Purpose |
|--------|---------|
| `company_subscription_current` VIEW | Latest subscription per `company_id` |
| `platform_dashboard_stats()` | SECURITY DEFINER aggregate for KPIs |
| `platform_extend_subscription(company_id, new_expires_at, reason)` | Manual extension + audit |
| `platform_set_company_status(company_id, status, reason)` | Suspend/reactivate |

### 9.7 RLS policy updates (summary)

See §10.

### 9.8 Signup trigger alignment

Update `handle_new_user()` to set `plan_code`, `billing_cycle`, `next_renewal_at` on trial subscription (align with `010` defaults).

---

## 10. RLS / security model

### Principles

1. **Tenant isolation default** — `company_id IN user_company_ids()`.
2. **Platform read** — `is_platform_admin() OR is_platform_support()` on tenant tables needed for support.
3. **Platform write** — only `is_platform_admin()` on sensitive tables OR no client write at all (service role + API).
4. **Platform-only tables** — no tenant policies; `SELECT` for platform roles via dedicated policies; `INSERT/UPDATE` denied for `authenticated` (service role only) OR admin-only policies.

### Table policy matrix (target)

| Table | Tenant SELECT | Platform SELECT | Tenant WRITE | Platform WRITE |
|-------|---------------|-----------------|--------------|----------------|
| `companies` | members | admin + support | admin (tenant) | **service role** for `account_status` |
| `subscriptions` | members | admin + support | blocked | **service role / RPC** |
| `payments` | members | admin + support | blocked | webhook only |
| `activity_logs` | members | admin + **support** (fix gap) | insert app | — |
| `announcements` | published targets | admin + support | — | admin API |
| `announcement_targets` | via join | admin | — | admin |
| `announcement_reads` | own user | — | own insert | — |
| `content_posts` | published | admin + support | — | admin |
| `support_tickets` | own company (future) | admin + support | tenant create (future) | support+ assign |
| `support_ticket_notes` | — | admin + support | — | support+ |
| `platform_admin_actions` | — | admin + support | — | service role |

### Fix existing gaps

| Gap | Action |
|-----|--------|
| `activity_logs` missing `is_platform_support()` | Add to SELECT policy (mirror companies) |
| `payments` platform read | Ensure `010` policies include support (already in P2.1 for subscriptions/payments) |
| Middleware blocks support from `/admin` | Allow support with route guards |
| `user_has_company_role` bypass | Only `is_platform_admin()` bypasses today — support should **not** bypass tenant role checks on tenant app |

### Tenant dashboard: suspended company

When `companies.account_status = 'suspended'`:

- Middleware or `requireTenantContext` returns 403 with code `COMPANY_SUSPENDED`.
- Read-only export allowed? **Decision: no** in v1 (full block).

---

## 11. Implementation phases

### Phase A.1 — Admin Data Layer ✅

**Goal:** Schema + RLS + views/RPCs; no UI.

- ✅ Migrations `012`–`014` (account status, `platform_admin_actions`, view, RPCs, RLS).
- ✅ View `company_subscription_current`.
- ✅ RPCs `platform_set_company_status`, `platform_extend_subscription`, `platform_dashboard_stats`.
- ✅ `activity_logs` SELECT for `platform_support`.
- ⏳ Application repositories (`PlatformRepository`) — deferred to A.2.

**Exit criteria:** SQL functions return correct KPIs on seed data; RLS verified with admin/support/tenant JWTs.

---

### Phase A.2 — Admin APIs

**Goal:** `src/application/platform/*` + `/api/platform/*`.

| Endpoint | Method | Role |
|----------|--------|------|
| `/api/platform/dashboard` | GET | support+ |
| `/api/platform/companies` | GET | support+ |
| `/api/platform/companies/[id]` | GET | support+ |
| `/api/platform/companies/[id]/suspend` | POST | admin |
| `/api/platform/companies/[id]/reactivate` | POST | admin |
| `/api/platform/subscriptions` | GET | support+ |
| `/api/platform/subscriptions/[id]/extend` | POST | admin |
| `/api/platform/subscriptions/[id]/cancel` | POST | admin |
| `/api/platform/payments` | GET | support+ |
| `/api/platform/announcements` | CRUD | admin (read support) |
| `/api/platform/content` | CRUD | admin |
| `/api/platform/support/tickets` | CRUD | support+ (mutations per matrix) |
| `/api/platform/activity` | GET | support+ |

Shared: `requirePlatformContext`, `mapPlatformRouteError`, service-role writes.

**Exit criteria:** Postman/curl suite passes; tenant cannot call platform APIs (403).

---

### Phase A.3 — Admin UI (core)

**Goal:** Replace mock data for sections 1–4.

- `usePlatformAdmin()` hook fetching dashboard APIs.
- Wire overview, companies, subscriptions, payments pages.
- Company detail page with suspend/extend modals (admin only).
- Update middleware for `platform_support`.
- Remove dependency on `mock-admin-data.ts` for core pages.

**Exit criteria:** Operator can list real companies, suspend, extend subscription, see real payments.

---

### Phase A.4 — Announcements

**Goal:** §5 + tenant dashboard banner.

- Admin CRUD UI.
- `GET /api/tenant/announcements` (active for active company).
- Dashboard component `AnnouncementBanner` (priority styling).
- `announcement_reads` dismiss / mark read.

**Exit criteria:** Published announcement visible to targeted tenant; not visible to others.

---

### Phase A.5 — Support

**Goal:** §7 internal support desk.

- Ticket queue + detail + notes.
- Optional: link from company profile.
- Email notifications (defer or minimal in-app only).

**Exit criteria:** Support agent can assign, change status, add internal note.

---

### Phase A.6 — Content CMS

**Goal:** §6.

- Admin editor (markdown).
- Tenant help routes for `help_article` + `release_note` surfaces.

**Exit criteria:** Published help article loads on tenant help page.

---

### Phase A.7 — Platform Admin QA

**Goal:** End-to-end verification.

| # | Test |
|---|------|
| 1 | Dashboard counts match SQL |
| 2 | Company search/filter |
| 3 | Suspend blocks tenant dashboard |
| 4 | Reactivate restores access |
| 5 | Manual extend updates `next_renewal_at` + audit row |
| 6 | Payments list matches tenant payments |
| 7 | Support role read-only on mutations (403) |
| 8 | Tenant cannot read `platform_admin_actions` |
| 9 | Announcement targeting |
| 10 | `npm run build` pass |

---

## Appendix A — Navigation map (target)

```text
/admin                      Dashboard (§1)
/admin/companies            Companies (§2)
/admin/companies/[id]       Company profile
/admin/subscriptions        Subscriptions (§3)
/admin/payments             Payments (§4)
/admin/announcements        Announcements (§5)
/admin/content              Content CMS (§6)
/admin/support              Support (§7)
/admin/settings             Platform settings (existing shell; security subset admin-only)

Deprecate / repurpose:
/admin/messages, /admin/whatsapp  →  fold into Announcements or remove from nav
/admin/analytics, /admin/notifications  →  merge into Dashboard or defer
```

---

## Appendix B — Application structure (target)

```text
src/application/platform/
  authorization.ts
  types.ts
  dashboard-use-cases.ts
  companies-use-cases.ts
  subscriptions-use-cases.ts
  payments-use-cases.ts
  announcements-use-cases.ts
  content-use-cases.ts
  support-use-cases.ts
  factory.ts

src/infrastructure/supabase/repositories/platform/
  platform.repository.ts
  platform-audit.repository.ts
  announcements.repository.ts
  content.repository.ts
  support.repository.ts

src/app/api/platform/...
src/app/[locale]/admin/...
src/components/admin/...  (wire to APIs)
src/hooks/use-platform-admin.ts
```

---

## Appendix C — Alignment with existing tenant billing (P2)

| Concern | Rule |
|---------|------|
| Subscription activation | Webhook / checkout remains source of truth for paid activation |
| Platform manual extend | Does not create `payments` row unless product decision requires it (v1: **no** payment row — support grant only) |
| Audit | Platform actions in `platform_admin_actions`; tenant billing in `activity_logs` |
| Moyasar/HyperPay | Out of scope until gateway phase; admin payments list already supports `manual` gateway |

---

## Appendix D — Open decisions (resolve before A.1 coding)

1. **Rename “clients” → “companies”** in UI/i18n only, or URL breaking change?
2. **Revenue metric:** all-time vs MTD vs both on dashboard?
3. **Account suspend vs subscription suspend:** always both or independent?
4. **Manual extension:** creates synthetic `payments` record for revenue tracking? (Recommend: no in v1.)
5. **`platform_support` edit announcements?** (Recommend: no in v1.)

---

*End of Platform Admin Phase A blueprint. No code implemented.*
