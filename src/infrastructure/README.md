# Infrastructure Layer

Adapters that implement domain repository interfaces.

## Structure

```
infrastructure/
├── supabase/
│   ├── client.ts              # Re-export from lib/supabase (migrate later)
│   ├── database.types.ts      # Generated via supabase gen types
│   └── repositories/
│       ├── identity.repository.ts
│       ├── company.repository.ts
│       ├── document-registry.repository.ts
│       ├── receipt.repository.ts
│       ├── payment.repository.ts
│       ├── invoice.repository.ts
│       └── billing.repository.ts
├── mock/
│   └── repositories/          # Wraps existing mock-data.ts for demo mode
├── storage/
│   └── company-assets.ts
└── payments/
    └── gateways/
```

## RLS

All Supabase queries rely on PostgreSQL RLS. Repositories still pass `TenantContext` for explicit filtering and clearer errors.

## Status

Not implemented — see `docs/architecture/` for migration plan.
