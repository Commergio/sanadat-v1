# P2.4.1 Billing QA

End-to-end verification checklist for manual billing (pre–real gateway).

## Automated (in-process, no DB)

```bash
npx tsx scripts/billing-qa.harness.ts
```

Covers: pending checkout, payment history, completed/failed webhooks, duplicate idempotency, amount mismatch, owner/admin vs accountant/viewer checkout permissions.

## Manual (local app + Supabase)

Prerequisites: `.env.local` with Supabase anon + **service role**, `BILLING_MANUAL_WEBHOOK_SECRET`, logged-in owner session.

| # | Check | How |
|---|--------|-----|
| 1 | Checkout creates pending payment | POST `/api/billing/checkout` → note `gatewayReference` |
| 2 | History shows pending | GET `/api/billing/payments` → top row `pending` |
| 3 | Completed webhook | POST `/api/billing/webhook/manual` with `status: completed` → payment `completed`, subscription `active`, `next_renewal_at` set |
| 4 | Failed webhook | New checkout → webhook `failed` → payment `failed`, subscription dates unchanged |
| 5 | Duplicate webhook | Repeat same `provider_event_id` → `{ duplicate: true }`, no double extension |
| 6 | Amount mismatch | Webhook with wrong `amount` → 400 `VALIDATION` |
| 7 | Owner/Admin checkout | UI button + API succeed |
| 8 | Accountant/Viewer | No checkout button; POST checkout → 403 `FORBIDDEN` |
| 9 | Dashboard widgets | After webhook, refocus tab or reload dashboard → compact widget shows `active` |

See [p2-billing-webhook.md](../architecture/p2-billing-webhook.md) for curl examples.

## Bugs fixed in P2.4.1

1. **GET subscription/payments** no longer require service role (`buildBillingReadApp`).
2. **Checkout attach / webhook updates** fail loudly when no pending row is updated (avoids silent missing `gateway_reference`).
3. **Dashboard billing data** refreshes on tab visibility after external webhook.
4. **Duplicate webhook replay** returns accurate `status` from stored payment.
