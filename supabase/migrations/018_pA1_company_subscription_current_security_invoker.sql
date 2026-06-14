-- Security Advisor: company_subscription_current ran as view owner (postgres),
-- bypassing RLS for any authenticated user with SELECT on the view.
-- Use security_invoker so underlying table RLS applies to the caller.
-- Requires PostgreSQL 15+ (Supabase default).

ALTER VIEW public.company_subscription_current SET (security_invoker = true);

COMMENT ON VIEW public.company_subscription_current IS
  'Latest subscription per company with account status, member/doc counts, and last tenant activity. security_invoker=true: platform staff see all rows via RLS; tenants see only member companies.';
