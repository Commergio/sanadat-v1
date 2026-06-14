# P2.6.1 Discount Coupons — Data Layer & APIs

Platform-managed discount coupons for subscription checkout. **No UI in this phase.**

---

## Database (migration `017`)

### `discount_coupons`

| Column | Notes |
|--------|--------|
| `code` | Unique, stored **uppercase**; validation is case-insensitive |
| `discount_type` | `percentage` \| `fixed_amount` |
| `discount_value` | Percentage: 0–100; fixed: > 0 |
| `currency` | Default `SAR` — must match plan currency |
| `max_redemptions` | Nullable global cap |
| `per_company_limit` | Default `1` |
| `starts_at` / `expires_at` | Nullable validity window |
| `active` | Must be true to apply |

### `discount_coupon_redemptions`

Links coupon usage to checkout: `payment_id`, optional `subscription_id`, amounts (`original`, `discount`, `final`).

Redemption limits count rows where linked `payments.status` is **`pending`** or **`completed`** (failed payments do not consume quota).

---

## Coupon rules

1. Code normalized to uppercase on write; lookup is case-insensitive.
2. Coupon must be **active** and within **start/end** dates (if set).
3. **Percentage**: `0 < value ≤ 100`.
4. **Fixed amount**: `value > 0`, capped at original plan price.
5. **Final amount** ≥ 0 (never negative).
6. **max_redemptions** enforced when set (pending + completed).
7. **per_company_limit** enforced per company (pending + completed).
8. Moyasar checkout rejected if final amount **< 1 SAR** (gateway minimum).

---

## RLS / security

| Role | `discount_coupons` | `discount_coupon_redemptions` |
|------|-------------------|------------------------------|
| `platform_admin` | CRUD | Read all |
| `platform_support` | Read | Read all |
| Tenant users | **No direct access** | Read own company only |
| Service role | Bypass (checkout writes) | Insert redemptions |

Tenants validate/apply coupons **only via API** (`POST /api/billing/coupons/validate`, checkout with `coupon_code`).

Platform audit: `platform_log_admin_action` RPC → `platform_admin_actions` with `coupon.created`, `coupon.updated`, `coupon.deleted`.

Tenant activity: `coupon.applied` on successful checkout start (pending payment + redemption created).

---

## API routes

### Platform (staff / admin)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/platform/coupons` | staff | Paginated list (`search`, `active`, `page`, `limit`) |
| `POST` | `/api/platform/coupons` | admin | Create coupon |
| `PATCH` | `/api/platform/coupons/[id]` | admin | Update coupon |
| `DELETE` | `/api/platform/coupons/[id]` | admin | Delete (blocked if redemptions exist) |

### Tenant

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/billing/coupons/validate` | billing readers | Preview discount for plan |

**Validate body**

```json
{
  "code": "SAVE20",
  "plan_code": "sanadat_annual",
  "billing_cycle": "yearly"
}
```

**Validate response (valid)**

```json
{
  "valid": true,
  "coupon_code": "SAVE20",
  "discount_type": "percentage",
  "discount_value": 20,
  "original_amount": 399,
  "discount_amount": 79.8,
  "final_amount": 319.2,
  "message": "Coupon applied successfully"
}
```

**Validate response (invalid)**

```json
{
  "valid": false,
  "coupon_code": null,
  "discount_type": null,
  "discount_value": null,
  "original_amount": 399,
  "discount_amount": null,
  "final_amount": null,
  "message": "Coupon not found"
}
```

---

## Checkout integration

`POST /api/billing/checkout` accepts optional `coupon_code`.

Flow:

1. Resolve plan price server-side (`399 SAR` for `sanadat_annual`).
2. Validate coupon (same rules as validate API).
3. **Pending payment idempotency** matches: gateway, **final amount**, currency, `plan_code`, and **`coupon_code`** in metadata. A pending payment without a coupon is not reused when a coupon is supplied (and vice versa).
4. Create `payments` row with:
   - `amount` = **final amount**
   - `metadata.original_amount`, `metadata.discount_amount`, `metadata.coupon_code`, `metadata.coupon_id`
5. Insert `discount_coupon_redemption` linked to payment.
6. Log `coupon.applied`.
7. Gateway session uses **final amount** only.

### Moyasar description

`Sanadat subscription - sanadat_annual - Coupon SAVE20`

---

## Application layout

```
src/application/coupons/
  types.ts, schemas.ts, calculate-discount.ts
  repository-ports.ts, use-cases.ts, factory.ts

src/infrastructure/supabase/repositories/coupons/
  coupon.repository.ts

src/app/api/platform/coupons/
src/app/api/billing/coupons/validate/
```

Checkout wiring: `src/application/billing/use-cases.ts` + `factory.ts`.

---

## Related docs

- [p2-billing-checkout.md](./p2-billing-checkout.md) — checkout baseline
- [p2-billing-data-layer.md](./p2-billing-data-layer.md) — payments schema
- [p2-5-1-moyasar-sandbox.md](./p2-5-1-moyasar-sandbox.md) — Moyasar sandbox
