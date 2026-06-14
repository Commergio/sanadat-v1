# P0 — Authentication & Multi-Tenant Foundation

**Status:** Implemented  
**Scope:** Database migrations, tenant resolution, Supabase auth (no payments, no platform admin API)

## Deliverables

### Database migrations

| File | Purpose |
|------|---------|
| `004_p0_multi_tenant_schema.sql` | `platform_role`, `tenant_role`, `company_members`, `company_invitations`, `owner_id` on companies |
| `005_p0_rls_helpers_and_policies.sql` | RLS helpers + membership-based policies |
| `006_p0_signup_trigger.sql` | Signup creates profile, company, **owner** membership, trialing subscription |

Apply in order after `001`–`003`:

```bash
# Supabase SQL Editor or CLI
001_initial_schema.sql
002_auth_triggers.sql   # superseded by 006 for trigger body
003_company_logos_storage.sql
004_p0_multi_tenant_schema.sql
005_p0_rls_helpers_and_policies.sql
006_p0_signup_trigger.sql
```

### Tenant architecture (`src/lib/tenant/`)

| Module | Role |
|--------|------|
| `types.ts` | `TenantContext`, `TenantRole`, `CompanyMembership` |
| `roles.ts` | Role rank, `hasMinimumTenantRole`, capability helpers |
| `tenant-context-service.ts` | `resolveTenantContext`, `listUserMemberships` |
| `tenant-cookie.ts` | `sanadat_active_company_id` httpOnly cookie |
| `mappers.ts` | DB row → domain types |

**API:** `POST /api/tenant/active-company` — switch active company (validates membership).

**Server helper:** `requireTenantContext()` in `src/lib/auth/require-tenant.ts`.

### Auth architecture (`src/lib/auth/`)

| Module | Role |
|--------|------|
| `client.ts` | Browser Supabase client (existing) |
| `session.ts` | `getServerAuthSession`, `isAuthenticated` |
| `require-tenant.ts` | `requireTenantContext` for protected server code |
| `errors.ts` | Auth error → i18n keys (existing) |

**Middleware:** Requires Supabase for `/dashboard`; sets active company cookie; blocks `/admin` unless `profiles.platform_role = platform_admin`.

**Callback:** `/auth/callback` (client page) handles PKCE `code`, `token_hash`, and hash tokens; sets active company cookie via `POST /api/auth/post-callback`; redirects to `next` or login with `message=email-confirmed-login-required`.

### Tenant roles

| Role | Rank | Intended use (P1+) |
|------|------|---------------------|
| `owner` | 4 | Billing, full settings, member management |
| `admin` | 3 | Settings, invites |
| `accountant` | 2 | Create/cancel documents |
| `viewer` | 1 | Read-only |

RLS enforces minimum role on inserts/updates. Application layer should call `hasMinimumTenantRole` before use cases.

### Removed in P0

- `IS_DEMO_MODE` / `NEXT_PUBLIC_DEMO_MODE`
- Simulated login/register
- `localStorage` company persistence
- Demo banners and prototype badges in dashboard
- Payment checkout (API returns `501`)

### Not in P0 (deferred)

- P1: Document CRUD via repositories
- P2: Payment webhooks & subscription renewal
- P4: Platform admin backend & real admin data

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Configure Supabase Auth:

- **Site URL:** `{NEXT_PUBLIC_APP_URL}` (no `/ar` suffix)
- **Redirect URLs:** `{NEXT_PUBLIC_APP_URL}/auth/callback`
- Signup `emailRedirectTo`: `{APP_URL}/auth/callback?next=/ar/dashboard`

## Manual platform admin (optional)

```sql
UPDATE profiles SET platform_role = 'platform_admin' WHERE email = 'you@example.com';
```
