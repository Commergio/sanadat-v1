# P2.5.1 — Moyasar Sandbox Checkout

**Status:** Implemented.  
**Depends on:** [P2.2 checkout](./p2-billing-checkout.md), [P2.3 webhook](./p2-billing-webhook.md).

Replaces the **manual checkout gateway** for `gateway: "moyasar"` with real Moyasar sandbox invoice sessions. Subscription activation still flows through the existing webhook layer (manual test route until Moyasar webhooks ship in a later phase).

---

## Environment (test keys only)

```env
MOYASAR_SECRET_KEY=sk_test_...
MOYASAR_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...
```

| Variable | Required | Notes |
|----------|----------|-------|
| `MOYASAR_SECRET_KEY` | ✅ | Must start with `sk_test_`. Live keys rejected. |
| `MOYASAR_PUBLIC_KEY` | ✅ | Must start with `pk_test_`. Validated at checkout. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Used for Moyasar `success_url` / `back_url` |

Validation: `validateMoyasarSandboxEnv()` in `src/lib/env.ts`.

---

## Gateway adapter

```
src/infrastructure/billing/gateways/
  moyasar.adapter.ts   # POST https://api.moyasar.com/v1/invoices
  moyasar.errors.ts
  manual.adapter.ts  # unchanged — used for gateway: "manual"
  index.ts           # moyasar → MoyasarCheckoutGateway
```

### Invoice creation

- Amount in halalas (`399 SAR` → `39900`)
- Metadata: `payment_id`, `company_id`, `plan_code`
- Returns hosted checkout `url` (Mada, Visa, Mastercard on Moyasar page)
- `checkoutSessionId` / `gatewayReference` = Moyasar invoice `id`

---

## Checkout flow

1. Owner/admin clicks **Renew** on `/dashboard/subscription`.
2. `POST /api/billing/checkout` with `gateway: "moyasar"`.
3. Server creates pending payment + Moyasar invoice.
4. Response includes `checkoutUrl`, `paymentId`, `gatewayReference`.
5. Browser redirects to Moyasar hosted page.
6. On success → `success_url` → `/ar/dashboard/subscription?checkout=success`.
7. On back/cancel → `back_url` → `?checkout=cancelled`.

**Activation:** checkout alone does not activate. Moyasar webhook ([P2.5.2](./p2-5-2-moyasar-webhook.md)) or manual webhook (P2.3) completes the journal entry.

---

## Sandbox testing

### 1. Configure keys

Copy **test** keys from [Moyasar Dashboard](https://moyasar.com) → Settings → API Keys.

### 2. Start checkout

Sign in as company owner/admin → Subscription → **Renew subscription**.

Or via API (with session cookie):

```bash
curl -X POST "http://localhost:3000/api/billing/checkout" \
  -H "Content-Type: application/json" \
  -H "Cookie: <session>" \
  -d '{
    "plan_code": "sanadat_annual",
    "billing_cycle": "yearly",
    "gateway": "moyasar"
  }'
```

### 3. Pay on Moyasar sandbox

Use Moyasar [test cards](https://docs.moyasar.com/guides/testing/test-cards):

| Network | Number (example) |
|---------|------------------|
| Mada | See Moyasar docs |
| Visa | `4111 1111 1111 1111` |
| Mastercard | `5454 5454 5454 5454` |

### 4. Confirm activation

With Moyasar webhooks configured ([P2.5.2](./p2-5-2-moyasar-webhook.md)), payment completion triggers activation automatically.

For local simulation without Moyasar delivery, use `POST /api/billing/webhook/moyasar` (see P2.5.2 curl example) or the manual webhook route (P2.3).

---

## API response

```json
{
  "paymentId": "uuid",
  "checkoutUrl": "https://moyasar.com/i/...",
  "checkoutSessionId": "moyasar-invoice-id",
  "gatewayReference": "moyasar-invoice-id",
  "amount": 399,
  "currency": "SAR",
  "planCode": "sanadat_annual",
  "billingCycle": "yearly",
  "gateway": "moyasar"
}
```

---

## Error codes

| Code | HTTP | When |
|------|------|------|
| `NOT_IMPLEMENTED` | 501 | Missing/invalid Moyasar test keys |
| `GATEWAY_ERROR` | 502 | Moyasar API failure |
| `VALIDATION` | 400 | Bad checkout input |

---

## Out of scope (P2.5.1)

- HyperPay / STC Pay (still manual adapter)
- Subscription schema changes

Moyasar webhooks: [P2.5.2](./p2-5-2-moyasar-webhook.md).
