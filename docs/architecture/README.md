# Sanadat Architecture

Production architecture for a scalable, multi-tenant Saudi document SaaS.

## Documents

| Document | Purpose |
|----------|---------|
| [Multi-tenant SaaS architecture](./multi-tenant-saas.md) | Tenancy model, layers, boundaries, scaling strategy |
| [Database design](./database-design.md) | Schema, RLS, indexes, partitioning, migration path |
| [P0 auth & tenant](./p0-auth-tenant.md) | Implemented P0: migrations, TenantContext, auth |

## Status

| Area | Status |
|------|--------|
| MVP (demo mode) | ✅ Running — mock data, localStorage |
| Phase 1 schema (`001`–`003`) | ✅ Designed — single-owner companies |
| P0 auth & tenancy (`004`–`006`) | ✅ Migrations + app wiring |
| Phase 2+ document registry | 📋 Planned (P1+) |
| Domain layer (`src/domain/`) | 📋 Scaffold — interfaces only |
| Application layer (`src/application/`) | 📋 Scaffold — use-case contracts only |
| Infrastructure (`src/infrastructure/`) | 📋 Scaffold — repository contracts only |

## Principles

1. **Tenant = Company** — every business record is scoped by `company_id`.
2. **Data isolation** — enforced at PostgreSQL RLS, not only in application code.
3. **Immutable documents** — create and cancel only; numbering never reused.
4. **Type-specific tables** — receipts, payments, invoices keep dedicated tables for clarity and scale.
5. **Unified document registry** — cross-type listing, search, and future document types without rewriting dashboards.
6. **Demo mode preserved** — `IS_DEMO_MODE` continues to use mock data until repositories are wired.

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

## Next implementation steps (not done yet)

1. Apply `004_multi_tenant_production.sql` to a staging Supabase project.
2. Generate Supabase TypeScript types (`supabase gen types`).
3. Implement `CompanyMemberRepository` and tenant context middleware.
4. Replace mock data imports in dashboard pages with application use cases.
5. Add admin platform RLS policies for `platform_role = 'platform_admin'`.
