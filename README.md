# سندات (Sanadat)

منصة SaaS سعودية لرقمنة سندات القبض والصرف والفواتير غير الضريبية للمنشآت الصغيرة.

## Production setup (P0 + P1)

Sanadat requires **Supabase** for authentication and multi-tenant data.

1. Create a Supabase project and run migrations `001`–`003`, then **`004`–`010` (P0 + P1 + P2.1)** — see [docs/architecture/p0-auth-tenant.md](docs/architecture/p0-auth-tenant.md).
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. In Supabase Auth → URL configuration, add redirect: `{APP_URL}/auth/callback`
4. `npm run dev` → register a company → sign in

P1 is now wired to real Supabase data:
- Tenant-aware create/list/detail for receipts, payments, invoices
- Cancel-only document lifecycle
- Real dashboard metrics and recent documents
- Activity logging for create/cancel/export/share
- Team management (members, invitations, accept flow, role changes)

## Tech Stack

- **Next.js 16** (App Router, webpack build) + TypeScript
- **Tailwind CSS v4** + shadcn/ui
- **next-intl** — Arabic & English
- **Supabase** — Auth, PostgreSQL (RLS), Storage
- **Zustand**, **React Hook Form + Zod**, **Recharts**, **jsPDF + html2canvas**

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill Supabase keys in .env.local
npm run dev
```

- Arabic: [http://localhost:3000/ar](http://localhost:3000/ar)
- English: [http://localhost:3000/en](http://localhost:3000/en)

## Build

```bash
npm run build
npm start
```

## Deploy on Vercel

See [docs/deployment-vercel.md](docs/deployment-vercel.md) for environment variables, Supabase auth URLs, and Moyasar webhook setup.

## Architecture

| Doc | Description |
|-----|-------------|
| [docs/architecture/README.md](docs/architecture/README.md) | Overview |
| [docs/architecture/p0-auth-tenant.md](docs/architecture/p0-auth-tenant.md) | P0 auth & tenancy |
| [docs/architecture/database-design.md](docs/architecture/database-design.md) | Database design |
| [docs/architecture/p2-billing-data-layer.md](docs/architecture/p2-billing-data-layer.md) | P2.1 billing schema & lifecycle |

## Database migrations

Run in Supabase SQL Editor (in order):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_triggers.sql`
3. `supabase/migrations/003_company_logos_storage.sql`
4. `supabase/migrations/004_p0_multi_tenant_schema.sql`
5. `supabase/migrations/005_p0_rls_helpers_and_policies.sql`
6. `supabase/migrations/006_p0_signup_trigger.sql`
7. `supabase/migrations/007_p1_document_cancellation.sql`
8. `supabase/migrations/008_p1_team_management_data_layer.sql`
9. `supabase/migrations/009_p1_team_accept_invitation_qa.sql`
10. `supabase/migrations/010_p2_billing_data_model.sql`
11. `supabase/migrations/011_p2_billing_manual_gateway.sql`

## P2.1 Billing data model (schema only)

- **Subscription lifecycle:** `trialing`, `active`, `expired`, `suspended`, `cancelled`
- **New fields:** `plan_code`, `billing_cycle`, `next_renewal_at`, `cancel_at_period_end`, `cancelled_at`, `cancelled_by`
- **Payment journal:** provider ids, timestamps, failure fields, billing period bounds
- **Idempotency indexes:** unique `(gateway, gateway_reference)` and `(gateway, provider_event_id)`
- **RLS:** tenants read own rows; no client INSERT/UPDATE/DELETE (mutations via service role/RPC in P2.2+)
- **Docs:** [p2-billing-data-layer.md](docs/architecture/p2-billing-data-layer.md)

## P2.2 Billing checkout (application only)

- **Use cases:** `startCheckout`, `getSubscription`, `listPayments`
- **API:** `POST /api/billing/checkout`, `GET /api/billing/subscription`, `GET /api/billing/payments`
- **Gateway:** `CheckoutGatewayPort` + manual/mock adapter (no Moyasar/HyperPay calls yet)
- **Pricing:** server-side `399 SAR` yearly — client amount ignored
- **Docs:** [p2-billing-checkout.md](docs/architecture/p2-billing-checkout.md)

## P2.3 Billing webhook (manual test)

- **Use case:** `processPaymentWebhook` — completes payment + activates subscription
- **API:** `POST /api/billing/webhook/manual` (header `x-billing-webhook-secret`)
- **Idempotency:** `provider_event_id` + `gateway_reference` rules
- **Activity logs:** `billing.payment_completed`, `billing.payment_failed`
- **Docs:** [p2-billing-webhook.md](docs/architecture/p2-billing-webhook.md) (includes curl test flow)

## P1 completion notes

- **Auth + tenancy:** enforced via `requireTenantContext()` and Supabase RLS.
- **Role model:** `owner/admin/accountant` can create/cancel, `viewer` can read only.
- **Numbering:** allocated via DB sequence function `get_next_document_number` (no reuse).
- **Cancellation:** status update only (`active -> cancelled`), documents remain visible.
- **Activity logs:** written to `activity_logs` with tenant scope (`company_id`), failures are non-blocking.

## P1.9 Team Management completion notes

- **Data layer:** secure RPCs for invite/accept/role change/remove/revoke with owner invariants (`008`, `009`).
- **Roles:** `owner/admin` manage team; `accountant/viewer` can view members only (no invite/revoke/role/remove).
- **Accept flow:** `/invite/[token]` → auth → `POST /api/team/invitations/accept` → active company cookie switch.
- **Tenant isolation:** member/invitation mutations are scoped to `ctx.companyId` + RLS + RPC checks.
- **Activity logs:** `team.invited`, `team.invite_accepted`, `team.role_changed`, `team.member_removed`, `team.invite_revoked`.

## License

Private — All rights reserved.
