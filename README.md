# سندات (Sanadat)

منصة SaaS سعودية لرقمنة سندات القبض والصرف والفواتير غير الضريبية للمنشآت الصغيرة.

## MVP prototype (management demo)

This branch is configured for **internal review** without Supabase or payment credentials:

- **Demo mode** activates automatically when Supabase env vars are missing (or set `NEXT_PUBLIC_DEMO_MODE=true`).
- All dashboard and admin pages use **mock data**.
- Login / register / forgot-password **simulate success** and redirect into the app.
- Subscription **renew** simulates payment and redirects back with a success message.
- PDF export, A4 preview, and bilingual UI (Arabic RTL / English LTR) work in the browser.

To connect real backend in phase 2: add Supabase keys and set `NEXT_PUBLIC_DEMO_MODE=false`.

## Tech Stack

- **Next.js 16** (App Router, webpack build) + TypeScript
- **Tailwind CSS v4** + shadcn/ui
- **next-intl** — Arabic & English
- **Supabase** — optional (phase 2)
- **Zustand**, **React Hook Form + Zod**, **Recharts**, **jsPDF + html2canvas**

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

- Arabic: [http://localhost:3000/ar](http://localhost:3000/ar)
- English: [http://localhost:3000/en](http://localhost:3000/en)

**Quick demo path:** Landing → **جرّب النظام** / Dashboard → explore receipts, payments, invoices, PDF, subscription, `/ar/admin`.

No `.env.local` is required for the prototype; an empty file is enough.

## Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Framework preset: **Next.js** (uses `vercel.json` → `next build --webpack`).
3. For **demo only**, you can deploy with **no environment variables** — demo mode turns on automatically.
4. Optional env for custom URL:
   - `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`
   - `NEXT_PUBLIC_DEMO_MODE` = `true`
5. Deploy. Root `/` redirects to `/ar`.

**Phase 2 (production):** add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, run SQL migrations in Supabase, set `NEXT_PUBLIC_DEMO_MODE=false`, configure Auth redirect URLs to include `/auth/callback`.

## Key routes

| Route | Description |
|-------|-------------|
| `/ar` | Landing |
| `/ar/login` | Login (demo: any valid form submits) |
| `/ar/register` | Register |
| `/ar/dashboard` | Client overview |
| `/ar/dashboard/receipts` | Receipt vouchers |
| `/ar/dashboard/payments` | Payment vouchers |
| `/ar/dashboard/invoices` | Invoices |
| `/ar/dashboard/subscription` | Subscription |
| `/ar/admin` | Admin dashboard |

Replace `ar` with `en` for English.

## Database (phase 2)

Run in Supabase SQL Editor:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_auth_triggers.sql`
- `supabase/migrations/003_company_logos_storage.sql`

## License

Private — All rights reserved.
