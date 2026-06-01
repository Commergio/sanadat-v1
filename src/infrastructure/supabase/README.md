# Supabase Infrastructure

## Generate types

```bash
supabase gen types typescript --project-id <project-id> > src/infrastructure/supabase/database.types.ts
```

## Repository implementations (planned)

| Interface | File | Table(s) |
|-----------|------|----------|
| `IdentityRepository` | `repositories/identity.repository.ts` | profiles, company_members |
| `CompanyRepository` | `repositories/company.repository.ts` | companies |
| `DocumentRegistryRepository` | `repositories/document-registry.repository.ts` | documents |
| `ReceiptRepository` | `repositories/receipt.repository.ts` | receipt_vouchers |
| `PaymentRepository` | `repositories/payment.repository.ts` | payment_vouchers |
| `InvoiceRepository` | `repositories/invoice.repository.ts` | invoices, invoice_items |
| `BillingRepository` | `repositories/billing.repository.ts` | subscriptions, payments, subscription_plans |

## RLS helpers (PostgreSQL)

- `auth.user_company_ids()`
- `auth.user_has_company_role(company_id, min_role)`
- `auth.is_platform_admin()`

See `supabase/migrations/004_multi_tenant_production.sql`.
