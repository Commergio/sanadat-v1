# Production environment checklist

Use this before pointing a custom domain at Sanadat production. Replace `https://your-domain.com` with your real URL.

## Vercel

| Variable | Required | Scope | Notes |
|----------|----------|-------|-------|
| `NEXT_PUBLIC_APP_URL` | Yes | Production | Canonical URL, no trailing slash — e.g. `https://sanadat.sa` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Production | From Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Production | Safe for browser; RLS enforced |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Production | **Server only** — billing webhooks, approval public APIs, signed URLs |
| `PAYMENTS_MODE` | Billing | Production | `sandbox` (default) or `live` — controls which Moyasar key prefixes are allowed |
| `MOYASAR_SECRET_KEY` | Billing | Production | `sk_test_...` when `PAYMENTS_MODE=sandbox`; `sk_live_...` when `PAYMENTS_MODE=live` |
| `MOYASAR_PUBLIC_KEY` | Billing | Production | `pk_test_...` when sandbox; `pk_live_...` when live — must match secret key type |
| `MOYASAR_WEBHOOK_SECRET` | Billing | Production | Must match Moyasar Dashboard webhook endpoint secret |
| `RESEND_API_KEY` | Email | Production | Transactional email from `tech@commergio.com` (account activation, subscription) — verify `commergio.com` in Resend |
| `BILLING_MANUAL_WEBHOOK_SECRET` | Optional | Preview only | Internal QA — do **not** set in production unless needed |

Vercel auto-provides `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL`; `getAppUrl()` uses them as fallback, but always set `NEXT_PUBLIC_APP_URL` for custom domains.

**Build:** Framework Next.js — build command `next build --webpack` (see `vercel.json`).

## Supabase

| Setting | Value |
|---------|-------|
| Site URL | `https://your-domain.com` |
| Redirect URLs | `https://your-domain.com/auth/callback` |
| | `https://your-domain.com/**` (wildcard for locale paths if needed) |
| Email confirmations | Enabled |
| Secure email change | Enabled |

### Migrations

Apply all migrations in `supabase/migrations/` through **027** (or latest) in order before launch. Do not skip P3 approval migrations (023–027).

### Storage buckets

- `document-signatures` — private; customer/document approval signatures
- Company logos bucket (if configured) — tenant-scoped uploads

### Service role safety

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — use only in:
  - `/api/billing/webhook/*`
  - `/api/approvals/[token]/*`
  - `/api/customer-verification/[token]/*`
  - Server-side signed URL generation after tenant authorization
- Never prefix with `NEXT_PUBLIC_`
- Never import in client components
- Rotate immediately if exposed in logs, commits, or client bundles

## Moyasar

| Item | Production value |
|------|------------------|
| Checkout callback | `https://your-domain.com/{locale}/dashboard/subscription?checkout=return` |
| Webhook URL | `https://your-domain.com/api/billing/webhook/moyasar` |
| Webhook events | `payment_paid`, `payment_failed` (and any others you subscribe to) |
| Webhook secret | Same string as `MOYASAR_WEBHOOK_SECRET` in Vercel |

### Sandbox vs live keys

| `PAYMENTS_MODE` | Secret key | Public key |
|-----------------|------------|------------|
| `sandbox` (default) | `sk_test_...` | `pk_test_...` |
| `live` | `sk_live_...` | `pk_live_...` |

Live keys are **rejected** unless `PAYMENTS_MODE=live` is set explicitly. Mixed pairs (`sk_live_` + `pk_test_`, or `sk_test_` + `pk_live_`) are always rejected.

Validation: `validateMoyasarPaymentsEnv()` in `src/lib/env.ts`. Misconfiguration is logged at server startup when keys are present.

## Auth redirect URLs (summary)

| Flow | Redirect target |
|------|-----------------|
| Email confirmation (signup) | `{APP_URL}/auth/callback?next=/{locale}/dashboard` |
| Password reset | `{APP_URL}/auth/callback?next=/{locale}/dashboard` (or login) |
| OAuth (if enabled later) | `{APP_URL}/auth/callback` |

Built by `buildAuthCallbackUrl()` in `src/lib/auth/callback-url.ts`.

## Public routes (no auth)

- `/{locale}` — landing
- `/{locale}/login`, `/register`, `/forgot-password`
- `/{locale}/contact`, `/privacy`, `/terms`
- `/{locale}/approve/[token]` — customer document approval
- `/{locale}/customer-verification/[token]` — customer signature verification
- `/auth/callback` — Supabase email/OAuth callback

## Key rotation

| Secret | When to rotate | Action |
|--------|----------------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Leak suspicion | Supabase → Settings → API → roll service role; update Vercel; redeploy |
| `MOYASAR_WEBHOOK_SECRET` | Leak or staff change | Regenerate in Moyasar Dashboard + Vercel |
| `BILLING_MANUAL_WEBHOOK_SECRET` | After QA | Unset in production |
| Anon key | Rare | Roll in Supabase; update Vercel; no RLS bypass risk |

## Pre-launch smoke test (no code changes)

1. `npm run build` passes locally
2. Vercel production deploy green
3. `/ar` and `/en` load landing + legal pages
4. Register → email confirm → login → dashboard
5. Create draft receipt → send approval → public approve → PDF enabled
6. Subscription checkout → Moyasar → webhook activates subscription
7. Platform admin can open `/ar/admin`

## Related docs

- [Supabase email templates](./supabase-email-templates.md)
- [QA checklist](./qa-checklist.md)
- [Vercel deployment](../deployment-vercel.md)
