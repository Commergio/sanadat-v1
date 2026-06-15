# P3.1 — Customers & Approval Foundation

Foundation for mandatory customer approval before issuing documents. **No approval sending, public page, or PDF restrictions in this phase.**

---

## Scope delivered

| Area | Status |
|------|--------|
| `customers` table + RLS | ✅ |
| Customer CRUD APIs (no delete) | ✅ |
| Dashboard `/dashboard/customers` UI | ✅ |
| `document_lifecycle_status` + approval columns on documents | ✅ |
| `document_approval_snapshots` | ✅ schema only |
| `document_approval_tokens` | ✅ schema only |
| `document-signatures` storage bucket | ✅ private, no tenant policies |
| Domain / TypeScript types | ✅ |
| Activity log action types extended | ✅ |
| `customer.created` / `customer.updated` wired | ✅ |

**Not in P3.1:** send-approval APIs, public `/approve/[token]`, signature upload, PDF/print gating, studio changes, OTP.

---

## Customer model

### Table: `customers`

| Column | Notes |
|--------|--------|
| `company_id` | Tenant scope; FK → `companies` |
| `name` | Required |
| `phone` | Required; Saudi mobile `05XXXXXXXX` in API validation |
| `email` | Optional |
| `national_id` | Optional |
| `default_signature_path` | Optional; for future reuse (P3.4) |
| `is_verified` | Default `false`; OTP in P3.5 |
| `verified_at` | Set when verified |
| `created_by` | `profiles.id` |

### Access control

| Role | List / read | Create / update |
|------|-------------|-----------------|
| `viewer` | ✅ | ❌ |
| `accountant` | ✅ | ✅ |
| `admin` / `owner` | ✅ | ✅ |

RLS: `SELECT` for all company members; `INSERT`/`UPDATE` for `accountant+`.

### APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/customers` | List; `?search=` name/phone `ilike` |
| `POST` | `/api/customers` | Create |
| `GET` | `/api/customers/[id]` | Detail |
| `PATCH` | `/api/customers/[id]` | Update |

Activity: `customer.created`, `customer.updated`.

---

## Document approval lifecycle (schema only)

### Enum: `document_lifecycle_status`

`draft` → `pending_approval` → `approved` → `issued`  
Also: `rejected`, `cancelled`

### Columns on `receipt_vouchers`, `payment_vouchers`, `invoices`

Approval metadata: token hash, sent/expiry/used timestamps, approver name/phone, signature path, IP/UA, rejection fields, `issued_at` / `issued_by`, `approval_snapshot_version`, `content_locked_at`, optional `customer_id` → `customers`.

### Backward compatibility

| Legacy `status` | `lifecycle_status` after migration |
|-----------------|----------------------------------|
| `active` | `issued` |
| `cancelled` | `cancelled` |

- **`status` column kept** — existing cancel RPCs and UI unchanged.
- **`lifecycle_status` default `issued`** — new rows behave like today until P3.2 changes create flow.
- **`issued_at` backfilled** from `created_at` for existing issued documents.
- Cancel RPCs updated to set `lifecycle_status = 'cancelled'` alongside `status`.

Existing documents continue to export/print/share without change.

---

## Supporting tables

### `document_approval_snapshots`

Immutable JSON `payload` per `(document_type, document_id, version)` — populated when sending for approval in **P3.2**.

### `document_approval_tokens`

`token_hash` PK; maps to document. **No RLS policies** for tenants — public approval will use service-role RPC/API in **P3.3**.

### Storage: `document-signatures`

- Private bucket (`public = false`)
- Max 512 KB; PNG/JPEG/WebP
- DB stores **path only** (`customer_signature_path`)
- No storage policies for tenants in P3.1 — uploads via API in P3.4

---

## TypeScript

- `src/domain/customers/entity.ts` — `Customer`, create/update inputs
- `src/domain/documents/shared/approval-types.ts` — lifecycle + snapshot/token types
- `DocumentBase` extends `DocumentApprovalFields`
- Mappers default `lifecycleStatus` → `issued` when column absent (local dev safety)

---

## Activity log actions (types added)

| Action | Wired in P3.1 |
|--------|----------------|
| `customer.created` | ✅ |
| `customer.updated` | ✅ |
| `document.draft_created` | types only |
| `document.approval_sent` | types only |
| `document.approved` | types only |
| `document.rejected` | types only |
| `document.issued` | types only |
| `document.approval_recalled` | types only |

---

## Why official numbering moves to issue-time (later)

P3.1 does **not** change `get_next_document_number` or nullable `number` columns.

In **P3.2+**, official `number` / `display_number` will be allocated only when `lifecycle_status` becomes `issued` (after customer approval), so rejected/cancelled drafts do not consume sequence numbers.

---

## Next phases

| Phase | Focus |
|-------|--------|
| **P3.2** | Receipt approval flow — draft, send approval, recall |
| **P3.3** | Public approval page `/approve/[token]` |
| **P3.4** | Signature capture + `document-signatures` upload |
| **P3.5** | Customer OTP phone verification |

---

## Migration

| File | When to use |
|------|-------------|
| `supabase/migrations/020_p31_customers_approval_foundation.sql` | Fresh apply via CLI |
| `supabase/migrations/021_p31_approval_foundation_idempotent.sql` | **Retry after deadlock** or partial 020 apply |

Apply on Supabase before using customers UI in production.

### If you get `deadlock detected` (40P01)

Common on **live** databases: migration `ALTER TABLE` on `receipt_vouchers` / `payment_vouchers` / `invoices` conflicts with the app reading those tables.

1. **Pause traffic** — stop Vercel deploy / close dashboard tabs using documents.
2. Wait ~30 seconds for aborted migration locks to clear.
3. Run **`021_p31_approval_foundation_idempotent.sql`** in SQL Editor (not 020 again).
4. Verify:

```sql
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers');
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'receipt_vouchers' AND column_name = 'lifecycle_status';
```
