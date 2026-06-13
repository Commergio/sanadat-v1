# Deploying Sanadat on Vercel

**Production URL:** `https://sanadat-v1-go457cy2u-commergios-projects.vercel.app`

## 1. Connect repository

- Import [Commergio/sanadat-v1](https://github.com/Commergio/sanadat-v1) in Vercel
- Framework: **Next.js** (detected from `vercel.json`)
- Build command: `next build --webpack` (already in `vercel.json`)

## 2. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server only — billing checkout & webhooks |
| `NEXT_PUBLIC_APP_URL` | ✅ Production | `https://sanadat-v1-go457cy2u-commergios-projects.vercel.app` |
| `MOYASAR_SECRET_KEY` | Billing | `sk_test_...` (sandbox) |
| `MOYASAR_PUBLIC_KEY` | Billing | `pk_test_...` (sandbox) |
| `MOYASAR_WEBHOOK_SECRET` | Billing | Same secret as Moyasar Dashboard webhook |
| `BILLING_MANUAL_WEBHOOK_SECRET` | Optional | Manual webhook testing only |

`getAppUrl()` falls back to `VERCEL_PROJECT_PRODUCTION_URL` when `NEXT_PUBLIC_APP_URL` is unset, but **set `NEXT_PUBLIC_APP_URL` explicitly** for custom domains and Moyasar redirect URLs.

## 3. Supabase Auth redirects

In Supabase → **Authentication → URL configuration**, add:

- Site URL: `https://sanadat-v1-go457cy2u-commergios-projects.vercel.app`
- Redirect URLs: `https://sanadat-v1-go457cy2u-commergios-projects.vercel.app/auth/callback`

## 4. Moyasar webhooks (production / preview)

Webhook URL:

```
https://sanadat-v1-go457cy2u-commergios-projects.vercel.app/api/billing/webhook/moyasar
```

Use the **production** domain (not preview URLs) for Moyasar dashboard webhooks.

## 5. Database migrations

Run Supabase migrations `001`–`016` in the SQL editor before first deploy. See [architecture README](./architecture/README.md).

## 6. Verify deploy

After deploy:

1. Open `/ar` and `/en` — landing page loads
2. Register / login — auth callback works
3. Dashboard loads with Supabase data
4. Subscription checkout redirects to Moyasar (if keys set)

Build locally matches Vercel:

```bash
npm run build
```
