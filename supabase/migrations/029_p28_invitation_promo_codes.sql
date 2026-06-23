-- P2.8: Invitation / promo codes — free subscription access grants

-- ─── 1. Subscription source ─────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE subscription_source AS ENUM ('trial', 'paid', 'promo', 'admin_grant');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS subscription_source subscription_source NOT NULL DEFAULT 'trial';

UPDATE subscriptions
SET subscription_source = CASE
  WHEN status = 'trialing' THEN 'trial'::subscription_source
  WHEN status = 'active' THEN 'paid'::subscription_source
  ELSE 'trial'::subscription_source
END
WHERE subscription_source IS NULL OR subscription_source = 'trial'::subscription_source;

COMMENT ON COLUMN subscriptions.subscription_source IS
  'How the current subscription period was granted: trial, paid, promo, or admin_grant';

-- ─── 2. Invitation promo codes ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invitation_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0 AND duration_days <= 3650),
  max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  per_company_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_company_limit > 0),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invitation_promo_codes_code_uppercase CHECK (code = upper(code)),
  CONSTRAINT invitation_promo_codes_code_unique UNIQUE (code)
);

COMMENT ON TABLE invitation_promo_codes IS
  'Platform invitation/promo codes granting free active subscription access (not checkout discounts)';

CREATE TABLE IF NOT EXISTS invitation_promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES invitation_promo_codes(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  redeemed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  granted_days INTEGER NOT NULL CHECK (granted_days > 0),
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE invitation_promo_redemptions IS
  'Redemption audit for invitation promo codes';

CREATE INDEX IF NOT EXISTS idx_invitation_promo_codes_active_dates
  ON invitation_promo_codes (active, starts_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_invitation_promo_redemptions_promo
  ON invitation_promo_redemptions (promo_code_id);

CREATE INDEX IF NOT EXISTS idx_invitation_promo_redemptions_company
  ON invitation_promo_redemptions (company_id, promo_code_id);

CREATE TRIGGER invitation_promo_codes_updated_at
  BEFORE UPDATE ON invitation_promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── 3. RLS ───────────────────────────────────────────────────────────────

ALTER TABLE invitation_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin manage invitation promo codes"
  ON invitation_promo_codes FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform support read invitation promo codes"
  ON invitation_promo_codes FOR SELECT
  USING (public.is_platform_support());

ALTER TABLE invitation_promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform staff read invitation promo redemptions"
  ON invitation_promo_redemptions FOR SELECT
  USING (public.is_platform_admin() OR public.is_platform_support());

CREATE POLICY "Tenants read own invitation promo redemptions"
  ON invitation_promo_redemptions FOR SELECT
  USING (company_id IN (SELECT public.user_company_ids()));

CREATE POLICY "No direct client insert invitation promo redemptions"
  ON invitation_promo_redemptions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct client update invitation promo redemptions"
  ON invitation_promo_redemptions FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No direct client delete invitation promo redemptions"
  ON invitation_promo_redemptions FOR DELETE
  USING (false);

-- ─── 4. Signup trigger: subscription_source = trial ───────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
BEGIN
  company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'منشأتي'
  );

  INSERT INTO public.profiles (id, email, phone, full_name, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    company_name,
    FALSE
  );

  INSERT INTO public.companies (
    user_id,
    owner_id,
    name,
    phone,
    email,
    profile_completed
  )
  VALUES (
    NEW.id,
    NEW.id,
    company_name,
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    30
  )
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (company_id, user_id, role, accepted_at)
  VALUES (new_company_id, NEW.id, 'owner', NOW());

  INSERT INTO public.subscriptions (
    company_id,
    status,
    amount,
    currency,
    plan_code,
    billing_cycle,
    expires_at,
    next_renewal_at,
    auto_renew,
    subscription_source
  )
  VALUES (
    new_company_id,
    'trialing',
    399.00,
    'SAR',
    'sanadat_annual',
    'yearly',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days',
    FALSE,
    'trial'
  );

  RETURN NEW;
END;
$$;

-- ─── 5. Platform view: subscription_source ────────────────────────────────
-- CREATE OR REPLACE VIEW cannot insert columns in the middle; append only.

CREATE OR REPLACE VIEW public.company_subscription_current AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  c.owner_id,
  owner_profile.email AS owner_email,
  c.account_status,
  c.suspended_at,
  c.suspended_by,
  c.suspension_reason,
  c.created_at AS company_created_at,
  s.id AS subscription_id,
  s.status AS subscription_status,
  s.plan_code,
  s.billing_cycle,
  s.amount AS plan_amount,
  s.currency AS plan_currency,
  s.starts_at AS subscription_starts_at,
  s.expires_at AS subscription_expires_at,
  s.next_renewal_at,
  s.auto_renew,
  s.cancel_at_period_end,
  s.cancelled_at AS subscription_cancelled_at,
  (
    SELECT COUNT(*)::bigint
    FROM company_members cm
    WHERE cm.company_id = c.id
  ) AS users_count,
  (
    SELECT COUNT(*)::bigint FROM receipt_vouchers rv WHERE rv.company_id = c.id
  ) + (
    SELECT COUNT(*)::bigint FROM payment_vouchers pv WHERE pv.company_id = c.id
  ) + (
    SELECT COUNT(*)::bigint FROM invoices inv WHERE inv.company_id = c.id
  ) AS documents_count,
  (
    SELECT MAX(al.created_at)
    FROM activity_logs al
    WHERE al.company_id = c.id
  ) AS latest_activity_at,
  s.subscription_source
FROM companies c
LEFT JOIN profiles owner_profile ON owner_profile.id = c.owner_id
LEFT JOIN LATERAL (
  SELECT sub.*
  FROM subscriptions sub
  WHERE sub.company_id = c.id
  ORDER BY sub.created_at DESC
  LIMIT 1
) s ON true;

ALTER VIEW public.company_subscription_current SET (security_invoker = true);

GRANT SELECT ON public.company_subscription_current TO authenticated;

COMMENT ON VIEW public.company_subscription_current IS
  'Latest subscription per company with account status, subscription source, member/doc counts';
