# P2.5 Final QA & Hardening — Moyasar Sandbox

**Status:** Complete (sandbox only).  
**Depends on:** [P2.5.1 checkout](./p2-5-1-moyasar-sandbox.md), [P2.5.2 webhook](./p2-5-2-moyasar-webhook.md).

Hardening pass after successful sandbox payment + webhook activation. No live keys, no billing architecture changes.

---

## Successful sandbox test result

Verified flow:

1. Owner/admin starts checkout → Moyasar hosted invoice opens.
2. Sandbox card payment succeeds → user returns to `/dashboard/subscription?checkout=success`.
3. Moyasar sends `payment_paid` webhook with `data.invoice_id` matching pending payment `gateway_reference`.
4. Webhook handler marks payment `completed`, sets `paid_at`, activates/extends subscription.
5. Subscription page shows active status and payment history row **مكتمل**.

---

## Webhook activation behavior

| Step | Behavior |
|------|----------|
| Auth | `x-moyasar-signature` HMAC or body `secret_token` |
| Event field | Top-level **`type`** (e.g. `payment_paid`) |
| Success | Payment → `completed`, subscription → `active`, `expires_at` extended |
| Failure events | Payment → `failed`, `failed_at` + `failure_reason` set; subscription unchanged |
| Ignored events | HTTP **200** `{ ok: true, ignored: true }` |
| Duplicate event id | HTTP **200** `{ ok: true, duplicate: true }` |
| Replay on completed/failed payment | HTTP **200** `{ ok: true, duplicate: true }` (no double extension) |

Temporary `[moyasar:webhook:debug]` logging was removed. Only safe server errors log `[moyasar:webhook] processing failed: <code>` on 5xx.

---

## Duplicate pending payment behavior

Before creating a new Moyasar checkout, the server checks for an existing **pending** payment for the same company:

- `gateway = moyasar`
- `plan_code = sanadat_annual` (in payment metadata)
- `amount = 399`
- `currency = SAR`

| Case | Result |
|------|--------|
| Pending + valid checkout URL | Reuse existing session (`reusedPending: true`), redirect user to same Moyasar invoice |
| Pending without checkout URL | HTTP **409** with Arabic message: *لديك دفعة قيد الانتظار…* |
| No matching pending | New pending payment + Moyasar invoice created |

---

## Subscription page UX (post-checkout)

| State | UI |
|-------|-----|
| `?checkout=success` + subscription not yet active | Banner: *تم الدفع عبر ميسر، سيتم تحديث اشتراكك خلال لحظات.* + auto-refresh 30s |
| Subscription becomes active | Banner: *تم تجديد اشتراكك بنجاح حتى {expires_at}.* |
| Latest payment completed | Pending warning hidden |
| Latest payment failed | Failed banner + **فشل** in payment history |
| Payment statuses | **قيد الانتظار** / **مكتمل** / **فشل** |

---

## Environment safety (sandbox only)

`validateMoyasarSandboxEnv()` rejects:

- Missing keys
- Live keys (`sk_live_` / `pk_live_`)
- Non-test key prefixes

Required: `sk_test_...`, `pk_test_...`, `MOYASAR_WEBHOOK_SECRET`.

---

## Final QA checklist

- [x] Debug payload logging removed from webhook route
- [x] Duplicate pending checkout prevented
- [x] Post-success subscription UX with polling refresh
- [x] Failed webhook marks payment failed without activating subscription
- [x] Webhook idempotency returns 200 on duplicates
- [x] Payment history labels (AR): قيد الانتظار / مكتمل / فشل
- [x] Sandbox key restriction enforced
- [x] `npm run build` passes

---

## Files touched in P2.5 Final QA

```
src/app/api/billing/webhook/moyasar/route.ts
src/application/billing/use-cases.ts
src/application/billing/webhook-use-cases.ts
src/application/billing/repository-ports.ts
src/infrastructure/supabase/repositories/billing/billing.repository.ts
src/components/subscription/subscription-billing-panel.tsx
src/hooks/use-billing.ts
messages/ar.json
messages/en.json
```
