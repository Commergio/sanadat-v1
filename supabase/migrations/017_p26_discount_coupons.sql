-- P2.6.1: Discount coupons for subscription checkout

DO $$ BEGIN
  CREATE TYPE discount_coupon_type AS ENUM ('percentage', 'fixed_amount');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type discount_coupon_type NOT NULL,
  discount_value NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  max_redemptions INTEGER,
  per_company_limit INTEGER NOT NULL DEFAULT 1,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT discount_coupons_code_uppercase CHECK (code = upper(code)),
  CONSTRAINT discount_coupons_code_unique UNIQUE (code),
  CONSTRAINT discount_coupons_percentage_range CHECK (
    discount_type <> 'percentage'::discount_coupon_type
    OR (discount_value > 0 AND discount_value <= 100)
  ),
  CONSTRAINT discount_coupons_fixed_positive CHECK (
    discount_type <> 'fixed_amount'::discount_coupon_type
    OR discount_value > 0
  ),
  CONSTRAINT discount_coupons_per_company_limit_positive CHECK (per_company_limit > 0)
);

COMMENT ON TABLE discount_coupons IS 'Platform-managed discount codes for subscription checkout';
COMMENT ON COLUMN discount_coupons.code IS 'Unique uppercase coupon code (case-insensitive at validation)';

CREATE TABLE IF NOT EXISTS discount_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES discount_coupons(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  redeemed_by UUID NOT NULL REFERENCES profiles(id),
  original_amount NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) NOT NULL,
  final_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE discount_coupon_redemptions IS 'Coupon usage linked to checkout payments';

CREATE INDEX IF NOT EXISTS idx_discount_coupons_active_dates
  ON discount_coupons (active, starts_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_discount_coupon_redemptions_coupon
  ON discount_coupon_redemptions (coupon_id);

CREATE INDEX IF NOT EXISTS idx_discount_coupon_redemptions_company
  ON discount_coupon_redemptions (company_id, coupon_id);

CREATE INDEX IF NOT EXISTS idx_discount_coupon_redemptions_payment
  ON discount_coupon_redemptions (payment_id)
  WHERE payment_id IS NOT NULL;

CREATE TRIGGER discount_coupons_updated_at
  BEFORE UPDATE ON discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Audit helper (platform_admin_actions)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.platform_log_admin_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden: platform_admin required';
  END IF;

  INSERT INTO platform_admin_actions (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.platform_log_admin_action(TEXT, TEXT, UUID, JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: discount_coupons
-- ---------------------------------------------------------------------------

ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin manage discount coupons"
  ON discount_coupons FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform support read discount coupons"
  ON discount_coupons FOR SELECT
  USING (public.is_platform_support());

-- Tenants cannot list coupons; validation is server-side only.

-- ---------------------------------------------------------------------------
-- RLS: discount_coupon_redemptions
-- ---------------------------------------------------------------------------

ALTER TABLE discount_coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform staff read coupon redemptions"
  ON discount_coupon_redemptions FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Tenants read own coupon redemptions"
  ON discount_coupon_redemptions FOR SELECT
  USING (company_id IN (SELECT public.user_company_ids()));

CREATE POLICY "No direct client insert on coupon redemptions"
  ON discount_coupon_redemptions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct client update on coupon redemptions"
  ON discount_coupon_redemptions FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No direct client delete on coupon redemptions"
  ON discount_coupon_redemptions FOR DELETE
  USING (false);
