-- P2.1: Billing data model and subscription hardening
-- Scope: schema + indexes + RLS only (no checkout, webhooks, or UI)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'cancelled';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
    CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Subscriptions: lifecycle fields
-- ---------------------------------------------------------------------------

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle billing_cycle,
  ADD COLUMN IF NOT EXISTS next_renewal_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);

UPDATE subscriptions
SET
  plan_code = COALESCE(plan_code, 'sanadat_annual'),
  billing_cycle = COALESCE(billing_cycle, 'yearly'::billing_cycle),
  next_renewal_at = COALESCE(next_renewal_at, expires_at)
WHERE plan_code IS NULL
   OR billing_cycle IS NULL
   OR next_renewal_at IS NULL;

ALTER TABLE subscriptions
  ALTER COLUMN plan_code SET DEFAULT 'sanadat_annual',
  ALTER COLUMN plan_code SET NOT NULL,
  ALTER COLUMN billing_cycle SET DEFAULT 'yearly',
  ALTER COLUMN billing_cycle SET NOT NULL;

COMMENT ON COLUMN subscriptions.plan_code IS 'Commercial plan identifier (e.g. sanadat_annual)';
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Renewal cadence for the plan';
COMMENT ON COLUMN subscriptions.next_renewal_at IS 'Next scheduled renewal/charge timestamp (UTC)';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'When true, subscription ends at expires_at without auto-renew';
COMMENT ON COLUMN subscriptions.cancelled_at IS 'When the subscription was cancelled';
COMMENT ON COLUMN subscriptions.cancelled_by IS 'Profile that initiated cancellation';

-- ---------------------------------------------------------------------------
-- Payments: provider journal fields
-- ---------------------------------------------------------------------------

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT,
  ADD COLUMN IF NOT EXISTS checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_code TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ;

COMMENT ON COLUMN payments.provider_event_id IS 'Gateway webhook/event id for idempotent processing';
COMMENT ON COLUMN payments.checkout_session_id IS 'Hosted checkout session id from gateway';
COMMENT ON COLUMN payments.payment_intent_id IS 'Gateway payment intent / charge id';
COMMENT ON COLUMN payments.paid_at IS 'When payment completed successfully';
COMMENT ON COLUMN payments.failed_at IS 'When payment failed definitively';
COMMENT ON COLUMN payments.period_start IS 'Subscription period covered (start)';
COMMENT ON COLUMN payments.period_end IS 'Subscription period covered (end)';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_subscriptions_company_status
  ON subscriptions (company_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal
  ON subscriptions (next_renewal_at)
  WHERE status IN ('active', 'trialing');

CREATE INDEX IF NOT EXISTS idx_payments_subscription
  ON payments (subscription_id)
  WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments (company_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_reference
  ON payments (gateway, gateway_reference)
  WHERE gateway_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_provider_event
  ON payments (gateway, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS hardening: tenant read-only; mutations via service role / SECURITY DEFINER
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can view subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Members can view billing payments" ON payments;

CREATE POLICY "Members can view subscriptions"
  ON subscriptions FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "No direct subscription insert"
  ON subscriptions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct subscription update"
  ON subscriptions FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No direct subscription delete"
  ON subscriptions FOR DELETE
  USING (false);

CREATE POLICY "Members can view billing payments"
  ON payments FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "No direct billing payment insert"
  ON payments FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct billing payment update"
  ON payments FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No direct billing payment delete"
  ON payments FOR DELETE
  USING (false);

-- ---------------------------------------------------------------------------
-- Signup trigger: seed plan fields on trial subscription
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
  trial_expires TIMESTAMPTZ;
BEGIN
  company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'منشأتي'
  );

  trial_expires := NOW() + INTERVAL '14 days';

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
    expires_at,
    auto_renew,
    plan_code,
    billing_cycle,
    next_renewal_at
  )
  VALUES (
    new_company_id,
    'trialing',
    399.00,
    trial_expires,
    FALSE,
    'sanadat_annual',
    'yearly',
    trial_expires
  );

  RETURN NEW;
END;
$$;
