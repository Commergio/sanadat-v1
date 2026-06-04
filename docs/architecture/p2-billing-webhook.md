# P2.3 Billing Webhook Processing

Manual webhook simulation for payment completion and subscription activation.  
**No Moyasar/HyperPay integration yet.**

---

## Source of truth

| Action | Allowed? |
|--------|----------|
| `POST /api/billing/checkout` creates `pending` payment | ✅ |
| Mock checkout URL proves payment | ❌ |
| `POST /api/billing/webhook/manual` (or future signed PSP webhook) | ✅ **Only this activates subscription** |

Checkout only reserves a pending journal entry. Activation happens when a webhook marks the payment `completed` and extends `subscriptions`.

---

## Use case

`processPaymentWebhook(input)` — service role only, no tenant session.

### Input

| Field | Required | Notes |
|-------|----------|-------|
| `gateway` | ✅ | `manual` for test route (others in P2.4+) |
| `provider_event_id` | ✅ | Idempotency key (unique per gateway) |
| `gateway_reference` | ✅ | From checkout response |
| `status` | ✅ | `completed` \| `failed` |
| `amount` | ✅ | Must match pending payment row |
| `currency` | ✅ | Must match pending payment row |
| `paid_at` | if `completed` | ISO timestamp |
| `failed_at` | if `failed` | ISO timestamp |
| `failure_code` | optional | |
| `failure_reason` | optional | |
| `raw_payload` | optional | Stored in `gateway_response` |

### On `completed`

1. Validate pending payment by `gateway_reference`.
2. Verify amount/currency match (server-side journal — never trust unchecked amounts).
3. Set payment `status = completed`, `paid_at`, `period_start`, `period_end`, `provider_event_id`.
4. Activate subscription: `status = active`, extend `expires_at` / `next_renewal_at` (+1 year from current period end or now).
5. Log `billing.payment_completed` (non-blocking).

### On `failed`

1. Set payment `status = failed`, `failed_at`, failure fields.
2. **Do not** change subscription.
3. Log `billing.payment_failed`.

---

## Idempotency rules

| Rule | Enforcement |
|------|-------------|
| Same `provider_event_id` + `gateway` twice | Second call returns `{ ok: true, duplicate: true }` — no double charge |
| Same `gateway_reference` completed twice | `ALREADY_PROCESSED` (409) |
| DB unique indexes | `(gateway, provider_event_id)`, `(gateway, gateway_reference)` |

---

## API route

`POST /api/billing/webhook/manual`

**Headers**

- `Content-Type: application/json`
- `x-billing-webhook-secret: <BILLING_MANUAL_WEBHOOK_SECRET>`

**Env**

```env
BILLING_MANUAL_WEBHOOK_SECRET=your_local_test_secret
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Manual test flow (curl)

### 1. Start checkout (authenticated owner/admin)

```bash
curl -X POST "http://localhost:3000/api/billing/checkout" \
  -H "Content-Type: application/json" \
  -H "Cookie: <your session cookies>" \
  -d '{
    "plan_code": "sanadat_annual",
    "billing_cycle": "yearly",
    "gateway": "manual"
  }'
```

Save `gatewayReference` and `amount` from the response.

### 2. Complete payment via manual webhook

```bash
curl -X POST "http://localhost:3000/api/billing/webhook/manual" \
  -H "Content-Type: application/json" \
  -H "x-billing-webhook-secret: your_local_test_secret" \
  -d '{
    "provider_event_id": "evt_manual_test_001",
    "gateway_reference": "PASTE_gatewayReference_FROM_STEP_1",
    "status": "completed",
    "amount": 399,
    "currency": "SAR",
    "paid_at": "2026-06-03T12:00:00.000Z",
    "raw_payload": { "simulated": true }
  }'
```

`gateway` defaults to `manual` on this route.

### 3. Verify (authenticated)

```bash
curl "http://localhost:3000/api/billing/subscription" -H "Cookie: ..."
curl "http://localhost:3000/api/billing/payments" -H "Cookie: ..."
```

Subscription should be `active` with `expires_at` ~1 year ahead.

### 4. Idempotency check

Repeat step 2 with the **same** `provider_event_id` → expect `{ "ok": true, "duplicate": true }`.

### 5. Simulate failure (new checkout first)

```bash
curl -X POST "http://localhost:3000/api/billing/webhook/manual" \
  -H "Content-Type: application/json" \
  -H "x-billing-webhook-secret: your_local_test_secret" \
  -d '{
    "provider_event_id": "evt_manual_fail_001",
    "gateway_reference": "NEW_PENDING_REFERENCE",
    "status": "failed",
    "amount": 399,
    "currency": "SAR",
    "failed_at": "2026-06-03T12:05:00.000Z",
    "failure_code": "card_declined",
    "failure_reason": "Simulated decline"
  }'
```

---

## Error codes

| Code | HTTP | When |
|------|------|------|
| `VALIDATION` | 400 | Bad payload, amount/currency mismatch, invalid status |
| `NOT_FOUND` | 404 | Unknown `gateway_reference` or subscription |
| `ALREADY_PROCESSED` | 409 | Reference already completed / not pending |
| `FORBIDDEN` | 403 | Wrong webhook secret |
| `NOT_IMPLEMENTED` | 501 | Missing service role or webhook secret |
| `CONFLICT` | 409 | DB unique violation (duplicate event) |

---

## Related

- [p2-billing-checkout.md](./p2-billing-checkout.md) — checkout creation (P2.2)
- [p2-billing-data-layer.md](./p2-billing-data-layer.md) — schema & RLS (P2.1)
