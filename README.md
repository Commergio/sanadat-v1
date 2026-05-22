# نظام السندات (Sanadat)

منصة SaaS سعودية لرقمنة سندات القبض والصرف والفواتير غير الضريبية للمنشآت الصغيرة.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + shadcn/ui components
- **Framer Motion** — animations
- **Supabase** — database, auth, RLS
- **next-intl** — Arabic RTL
- **Zustand** — client state
- **React Hook Form + Zod** — validation
- **Recharts** — analytics
- **jsPDF + html2canvas** — PDF export

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/ar`.

## Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MOYASAR_API_KEY=
HYPERPAY_ENTITY_ID=
STC_PAY_MERCHANT_ID=
```

## Database Setup

Run the migration in Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # Arabic routes (/ar)
│   │   ├── page.tsx        # Landing page
│   │   ├── (auth)/         # Login, Register, Forgot Password
│   │   ├── dashboard/      # Client dashboard
│   │   ├── admin/          # Admin dashboard
│   │   └── onboarding/     # Welcome wizard
│   └── api/
│       └── payments/       # Payment create + webhook
├── components/
│   ├── ui/                 # shadcn primitives
│   ├── landing/            # Marketing sections
│   ├── dashboard/          # Dashboard widgets
│   ├── documents/          # A4 templates, forms
│   └── admin/              # Admin sidebar
├── lib/
│   ├── payments/           # Moyasar, HyperPay, STC Pay
│   ├── supabase/           # Client helpers
│   └── validations.ts      # Zod schemas
└── stores/                 # Zustand
```

## Key Routes

| Route | Description |
|-------|-------------|
| `/ar` | Landing page |
| `/ar/login` | Authentication |
| `/ar/dashboard` | Client overview |
| `/ar/dashboard/receipts` | Receipt vouchers |
| `/ar/dashboard/payments` | Payment vouchers |
| `/ar/dashboard/invoices` | Non-tax invoices |
| `/ar/dashboard/subscription` | Subscription management |
| `/ar/admin` | Admin dashboard |

## Business Rules

- Documents are **immutable** after creation
- Only **cancellation** is allowed (with reason)
- Sequential numbering — numbers **never reused**
- Cancelled documents remain visible in records
- Admin **cannot edit** client documents

## Payment Integration

Architecture-ready for:
- **Moyasar** — `MOYASAR_API_KEY`
- **HyperPay** — `HYPERPAY_ENTITY_ID`
- **STC Pay** — `STC_PAY_MERCHANT_ID`

Flow: Subscribe → Redirect → Webhook → Activate account

## License

Private — All rights reserved.
