# Domain Layer

Pure business logic — **no** Supabase, React, or Next.js imports.

## Structure

```
domain/
├── shared/           # Cross-cutting value objects
├── identity/         # Users, memberships, roles
├── company/          # Tenant (company) entity
├── documents/        # Document bounded context
│   ├── shared/       # Base types, registry, shared ports
│   ├── receipt/
│   ├── payment/
│   └── invoice/
└── billing/          # Plans, subscriptions, payments
```

## Rules

1. Entities express business invariants (immutable documents, tenant scoping).
2. Repository interfaces define **ports** — implemented in `src/infrastructure/`.
3. Domain errors are typed — no string throwing.
4. Legacy `src/lib/types.ts` re-exports from here during migration.

## Status

Scaffold only — interfaces and types. No runtime wiring yet.
