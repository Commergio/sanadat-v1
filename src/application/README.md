# Application Layer

Use cases orchestrate domain operations. Each use case:

1. Accepts `TenantContext` (never trust client-supplied `companyId` alone).
2. Validates subscription status when required.
3. Calls domain repositories (injected — Supabase or mock).
4. Returns domain entities or presentation DTOs.

## Structure

```
application/
├── tenancy/          # Resolve active tenant, membership checks
├── documents/        # Create/list/cancel documents
├── company/          # Company settings
└── billing/          # Subscription, renewals
```

## Demo vs production

```typescript
// Composition root (future: src/infrastructure/di.ts)
const repos = supabaseRepositories;
const createReceipt = new CreateReceiptUseCase(repos.receipt, repos.sequence);
```

## Status

Contracts only — implementations come in phase 2.
