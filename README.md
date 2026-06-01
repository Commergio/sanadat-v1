# سندات (Sanadat)

منصة SaaS سعودية لرقمنة سندات القبض والصرف والفواتير غير الضريبية للمنشآت الصغيرة.

## Production setup (P0+)

Sanadat requires **Supabase** for authentication and multi-tenant data.

1. Create a Supabase project and run migrations `001`–`003`, then **`004`–`006` (P0)** — see [docs/architecture/p0-auth-tenant.md](docs/architecture/p0-auth-tenant.md).
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. In Supabase Auth → URL configuration, add redirect: `{APP_URL}/auth/callback`
4. `npm run dev` → register a company → sign in

Dashboard document lists are empty until **P1** (document repositories). Studio UI and PDF export still work locally.

## Tech Stack

- **Next.js 16** (App Router, webpack build) + TypeScript
- **Tailwind CSS v4** + shadcn/ui
- **next-intl** — Arabic & English
- **Supabase** — Auth, PostgreSQL (RLS), Storage
- **Zustand**, **React Hook Form + Zod**, **Recharts**, **jsPDF + html2canvas**

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill Supabase keys in .env.local
npm run dev
```

- Arabic: [http://localhost:3000/ar](http://localhost:3000/ar)
- English: [http://localhost:3000/en](http://localhost:3000/en)

## Build

```bash
npm run build
npm start
```

## Architecture

| Doc | Description |
|-----|-------------|
| [docs/architecture/README.md](docs/architecture/README.md) | Overview |
| [docs/architecture/p0-auth-tenant.md](docs/architecture/p0-auth-tenant.md) | P0 auth & tenancy |
| [docs/architecture/database-design.md](docs/architecture/database-design.md) | Database design |

## Database migrations

Run in Supabase SQL Editor (in order):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_triggers.sql`
3. `supabase/migrations/003_company_logos_storage.sql`
4. `supabase/migrations/004_p0_multi_tenant_schema.sql`
5. `supabase/migrations/005_p0_rls_helpers_and_policies.sql`
6. `supabase/migrations/006_p0_signup_trigger.sql`

## License

Private — All rights reserved.
