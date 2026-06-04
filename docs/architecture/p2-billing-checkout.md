# P2.2 Billing Checkout Application Layer

Checkout creation without real Moyasar/HyperPay/STC Pay API calls.  
**Webhook activation is the source of truth** — see [p2-billing-webhook.md](./p2-billing-webhook.md) (P2.3).

---

## API routes

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/billing/checkout` | owner/admin | Start checkout → pending payment + mock session |
| `GET` | `/api/billing/subscription` | all members | Current company subscription |
| `GET` | `/api/billing/payments` | all members | Billing payment journal for company |

### `POST /api/billing/checkout` body

```json
{
  "plan_code": "sanadat_annual",
  "billing_cycle": "yearly",
  "gateway": "manual"
}
```

`gateway`: `moyasar` | `hyperpay` | `stcpay` | `manual`

### Response (example)

```json
{
  "paymentId": "uuid",
  "checkoutUrl": "https://app/billing/mock-checkout?...",
  "checkoutSessionId": "manual_sess_...",
  "gatewayReference": "manual_ref_...",
  "amount": 399,
  "currency": "SAR",
  "planCode": "sanadat_annual",
  "billingCycle": "yearly",
  "gateway": "manual"
}
```

---

## Application layer

```
src/application/billing/
  authorization.ts   # owner/admin checkout; all members read
  constants.ts       # server-side plan prices (399 SAR yearly)
  schemas.ts         # Zod validation
  use-cases.ts       # startCheckout, getSubscription, listPayments
  factory.ts         # wires repository + gateways
```

### Use cases

1. **`startCheckout(ctx, input)`**
   - Validates input (`plan_code`, `billing_cycle: yearly`, `gateway`).
   - Resolves price from `BILLING_PLANS` — **never trusts client amount**.
   - Inserts `payments` row with `status = pending` (service role).
   - Calls gateway adapter → stores `checkout_session_id`, `gateway_reference`.
   - Returns mock `checkoutUrl`.

2. **`getSubscription(ctx)`** — latest subscription for `ctx.companyId` (RLS read).

3. **`listPayments(ctx)`** — billing journal for company (RLS read).

---

## Gateway adapter abstraction

```
src/infrastructure/billing/gateways/
  types.ts           # CheckoutGatewayPort
  manual.adapter.ts  # mock session (P2.2)
  index.ts           # getCheckoutGateway() — all gateways → manual stub
```

```typescript
interface CheckoutGatewayPort {
  createCheckoutSession(input): Promise<{
    checkoutUrl: string;
    checkoutSessionId: string;
    gatewayReference: string;
  }>;
}
```

Real Moyasar/HyperPay adapters will implement the same port in a later phase.

---

## Why webhook is still source of truth

| Step | P2.2 checkout | P2.3 webhook (manual test) | Production PSP |
|------|---------------|----------------------------|----------------|
| User starts checkout | Pending payment + mock URL | Same | Real hosted page |
| Payment confirmed | — | `POST /api/billing/webhook/manual` | Signed Moyasar/HyperPay webhook |
| Subscription activated | **No** | **Yes** (on `completed`) | **Yes** |
| Idempotency | DB unique indexes | `processPaymentWebhook` dedupes | Same |

**Never** set `subscriptions.status = active` or `payments.status = completed` from the checkout API alone.  
A mock checkout URL does not prove payment — only a signed webhook (or manual admin tool) may complete the journal entry and activate the tenant.

---

## Authorization

| Action | owner | admin | accountant | viewer |
|--------|-------|-------|------------|--------|
| `startCheckout` | ✅ | ✅ | ❌ | ❌ |
| `getSubscription` | ✅ | ✅ | ✅ | ✅ |
| `listPayments` | ✅ | ✅ | ✅ | ✅ |

---

## Server requirements

- `SUPABASE_SERVICE_ROLE_KEY` must be set on the server to insert/update `payments` (RLS blocks client writes per `010`).
- Reads use the authenticated Supabase client + tenant cookie.

---

## Error codes

| Code | HTTP | When |
|------|------|------|
| `VALIDATION` | 400 | Bad input / unknown plan |
| `FORBIDDEN` | 403 | accountant/viewer checkout |
| `NOT_FOUND` | 404 | Tenant resolution failure |
| `UNAUTHENTICATED` | 401 | No session |
| `NOT_IMPLEMENTED` | 501 | Service role key missing |
| `INTERNAL` | 500 | Unexpected failure |

---

## Related files

- Migration `011` — `manual` on `payment_gateway` enum
- [p2-billing-data-layer.md](./p2-billing-data-layer.md) — schema & RLS
