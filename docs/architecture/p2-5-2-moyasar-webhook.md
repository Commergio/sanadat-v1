# P2.5.2 — Moyasar Webhook Integration

**Status:** Implemented.  
**Depends on:** [P2.3 webhook](./p2-billing-webhook.md), [P2.5.1 checkout](./p2-5-1-moyasar-sandbox.md).

Processes real Moyasar webhook events through the existing `processPaymentWebhook` use-case. No checkout or subscription schema changes.

---

## Endpoint

```
POST {APP_URL}/api/billing/webhook/moyasar
```

Example: `https://your-app.com/api/billing/webhook/moyasar`

No tenant session required. Protected by webhook secret verification.

---

## Moyasar Dashboard setup

1. Go to **Settings → Webhooks** → **Create webhook**.
2. URL: `{NEXT_PUBLIC_APP_URL}/api/billing/webhook/moyasar`
3. Set a **shared secret** and copy it to `MOYASAR_WEBHOOK_SECRET`.
4. Subscribe to events (minimum):
   - `payment_paid`
   - `payment_failed` (or `payment_faild` per Moyasar docs typo)
   - Optional: `payment_voided`, `payment_expired`, `payment_canceled`, `payment_abandoned`

Moyasar embeds the shared secret as `secret_token` in each webhook body.

---

## Environment

```env
MOYASAR_WEBHOOK_SECRET=your_webhook_shared_secret
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Verification

| Method | When |
|--------|------|
| `x-moyasar-signature` | HMAC-SHA256 of raw body with `MOYASAR_WEBHOOK_SECRET` (hex or base64) |
| `secret_token` in JSON | Constant-time compare with `MOYASAR_WEBHOOK_SECRET` |

**Sandbox note:** Moyasar may omit `x-moyasar-signature` in test mode. The route accepts deliveries when `secret_token` matches. Configure the same secret in the dashboard and `.env`.

---

## Event mapping

| Moyasar event | Billing action |
|---------------|----------------|
| `payment_paid` | `status: completed` → activate/extend subscription |
| `payment_failed`, `payment_faild` | `status: failed` |
| `payment_voided`, `payment_canceled`, `payment_expired`, `payment_abandoned` | `status: failed` |
| `payment_authorized`, `payment_captured`, `payment_verified`, `payment_refunded` | Ignored (`200`, `ignored: true`) |

---

## Payload mapping → `processPaymentWebhook`

| Field | Source |
|-------|--------|
| `gateway` | `moyasar` |
| `provider_event_id` | Webhook envelope `id` |
| `gateway_reference` | Payment `invoice_id` (matches checkout invoice id) |
| `amount` | Payment `amount` ÷ 100 (halalas → SAR) |
| `currency` | Payment `currency` |
| `paid_at` / `failed_at` | Payment `updated_at` or webhook `created_at` |
| `raw_payload` | Full webhook JSON |

---

## Idempotency

Handled by P2.3 logic + P2.5 Final QA hardening:

- Duplicate `provider_event_id` → HTTP **200** `{ ok: true, duplicate: true }`
- Replay webhook for already **completed** or **failed** payment (same `gateway_reference`) → HTTP **200** `{ ok: true, duplicate: true }` — subscription is **not** extended twice
- DB unique indexes on `(gateway, provider_event_id)` and `(gateway, gateway_reference)`

---

## Duplicate pending checkout (P2.5 Final QA)

See [P2.5 Final QA](./p2-5-final-qa.md). Checkout reuses an existing pending Moyasar session when plan/amount/currency match.

---

## Sandbox test flow

1. Configure `MOYASAR_*` keys and `MOYASAR_WEBHOOK_SECRET`.
2. Register webhook URL in Moyasar (use ngrok for local dev).
3. Owner/admin → **Renew subscription** → pay on Moyasar sandbox.
4. Moyasar sends `payment_paid` webhook.
5. Verify:
   - Payment journal → `completed`
   - Subscription → `active`, extended `expires_at`
   - Dashboard subscription widget reflects active status
   - Payment history shows completed row

### Local webhook simulation

```bash
curl -X POST "http://localhost:3000/api/billing/webhook/moyasar" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_test_001",
    "type": "payment_paid",
    "created_at": "2026-06-04T12:00:00.000Z",
    "secret_token": "'"$MOYASAR_WEBHOOK_SECRET"'",
    "live": false,
    "data": {
      "id": "pay_test_001",
      "status": "paid",
      "amount": 39900,
      "currency": "SAR",
      "invoice_id": "<invoice id from checkout>",
      "updated_at": "2026-06-04T12:00:00.000Z"
    }
  }'
```

---

## Files

```
src/app/api/billing/webhook/moyasar/route.ts
src/infrastructure/billing/webhooks/moyasar/
  verify.ts
  map-payload.ts
  types.ts
```

Manual webhook (`/api/billing/webhook/manual`) remains for internal testing.
