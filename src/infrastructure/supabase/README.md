# Supabase Infrastructure

## Generate types

```bash
supabase gen types typescript --project-id <project-id> > src/infrastructure/supabase/database.types.ts
```

## Repository implementations

| Interface | File | Table(s) |
|-----------|------|----------|
| `IdentityRepository` | `repositories/identity.repository.ts` | profiles, company_members |
| `CompanyRepository` | `repositories/company.repository.ts` | companies |
| `DocumentRegistryRepository` | `repositories/document-registry.repository.ts` | documents |
| `ReceiptRepository` | `repositories/documents/receipt.repository.ts` | receipt_vouchers |
| `PaymentVoucherRepository` | `repositories/documents/payment-voucher.repository.ts` | payment_vouchers |
| `InvoiceRepository` | `repositories/documents/invoice.repository.ts` | invoices, invoice_items |
| `DocumentNumberRepository` | `repositories/documents/document-number.repository.ts` | document_sequences (RPC) |
| `BillingRepository` | `repositories/billing.repository.ts` | subscriptions, payments, subscription_plans |

## RLS helpers (PostgreSQL)

- `auth.user_company_ids()`
- `auth.user_has_company_role(company_id, min_role)`
- `auth.is_platform_admin()`

See `supabase/migrations/005_p0_rls_helpers_and_policies.sql`.
