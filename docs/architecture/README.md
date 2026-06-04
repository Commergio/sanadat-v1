# Sanadat Architecture

Production architecture for a scalable, multi-tenant Saudi document SaaS.

## Documents

| Document | Purpose |
|----------|---------|
| [Multi-tenant SaaS architecture](./multi-tenant-saas.md) | Tenancy model, layers, boundaries, scaling strategy |
| [Database design](./database-design.md) | Schema, RLS, indexes, partitioning, migration path |
| [P0 auth & tenant](./p0-auth-tenant.md) | Implemented P0: migrations, TenantContext, auth |
| [P1 team data layer](./p1-team-management-data-layer.md) | Implemented P1.9.1: invitations lifecycle, team RPCs, RLS hardening |
| [P2 billing data layer](./p2-billing-data-layer.md) | Implemented P2.1: subscription/payment schema, indexes, RLS |
| [P2 billing checkout](./p2-billing-checkout.md) | Implemented P2.2: checkout use-cases, API, gateway adapter stub |
| [P2 billing webhook](./p2-billing-webhook.md) | Implemented P2.3: manual webhook, subscription activation |
| [Platform admin blueprint](./platform-admin-phase-a-blueprint.md) | Phase A design: internal admin console |
| [P A.1 platform admin data layer](./pA1-platform-admin-data-layer.md) | Implemented: account status, audit, view, RPCs, RLS (`012`–`014`) |
| [P A.2 platform admin APIs](./pA2-platform-admin-apis.md) | Implemented: `/api/platform/*`, `requirePlatformContext` |
| P1.9 Team Management (app + API + UI) | ✅ Complete — see README P1.9 notes |

## Status

| Area | Status |
|------|--------|
| MVP (demo mode) | ✅ Removed from document flows |
| Phase 1 schema (`001`–`003`) | ✅ Designed — single-owner companies |
| P0 auth & tenancy (`004`–`006`) | ✅ Migrations + app wiring |
| P1 documents + dashboard (`P1.1`–`P1.8`) | ✅ Wired to Supabase (repos, use-cases, API, UI) |
| P1.9 team management (`P1.9.1`–`P1.9.3`) | ✅ Data layer, use-cases, API, UI, QA stabilization |
| P2.1 billing data model | ✅ Migrations `010` — lifecycle fields, payment journal, RLS |
| P2.2 billing checkout layer | ✅ Use-cases, API routes, manual gateway adapter (no real PSP) |
| P2.3 billing webhook | ✅ Manual webhook route, activation, idempotency, activity logs |
| P A.1 platform admin data layer | ✅ Migrations `012`–`014` — account status, audit, view, RPCs |
| P A.2 platform admin APIs | ✅ `/api/platform/*` — dashboard, companies, subscriptions, payments, actions |
| P A.3 platform admin UI (core) | ✅ Wired overview, clients, detail, subscriptions, payments, actions |
| P A.4–A.7 platform admin app | ⏳ Announcements, support (see blueprint) |
| Domain layer (`src/domain/`) | ✅ Active in production document flow |
| Application layer (`src/application/`) | ✅ Use-cases + validation + authorization |
| Infrastructure (`src/infrastructure/`) | ✅ Supabase repositories + activity logging |

## Principles

1. **Tenant = Company** — every business record is scoped by `company_id`.
2. **Data isolation** — enforced at PostgreSQL RLS, not only in application code.
3. **Immutable documents** — create and cancel only; numbering never reused.
4. **Type-specific tables** — receipts, payments, invoices keep dedicated tables for clarity and scale.
5. **Unified document registry** — cross-type listing, search, and future document types without rewriting dashboards.
6. **Observability by design** — document events are written to `activity_logs` without breaking primary flows.

## Folder map (target)

```
src/
├── domain/              # Entities, value objects, repository interfaces
├── application/         # Use cases (orchestration, no Supabase)
├── infrastructure/      # Supabase repos, storage, payment gateways
├── app/                 # Next.js routes (thin — call application layer)
├── components/          # UI (existing — unchanged for now)
├── lib/                 # Legacy shared code (migrate gradually)
└── hooks/               # UI hooks (migrate gradually)
```

## Next implementation steps

1. Add automated integration tests for team role matrix (owner/admin/accountant/viewer).
2. Add audit views for `activity_logs` (tenant self-service page).
3. Add DB-level transactional create for invoice header + items via RPC.
4. Add platform admin reporting surfaces (out of current scope).
5. Add billing/payment gateway features (out of current scope).
