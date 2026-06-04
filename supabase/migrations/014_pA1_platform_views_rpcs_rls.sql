-- P A.1: Platform admin views, RPCs, RLS parity for support staff

-- ---------------------------------------------------------------------------
-- Helper: platform staff (admin or support)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin() OR public.is_platform_support();
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_staff() TO authenticated;

-- ---------------------------------------------------------------------------
-- View: one row per company with current subscription + aggregates
-- ---------------------------------------------------------------------------

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
  ) AS latest_activity_at
FROM companies c
LEFT JOIN profiles owner_profile ON owner_profile.id = c.owner_id
LEFT JOIN LATERAL (
  SELECT sub.*
  FROM subscriptions sub
  WHERE sub.company_id = c.id
  ORDER BY sub.created_at DESC
  LIMIT 1
) s ON true;

COMMENT ON VIEW public.company_subscription_current IS
  'Latest subscription per company with account status, member/doc counts, and last tenant activity';

GRANT SELECT ON public.company_subscription_current TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: platform_set_company_status
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.platform_set_company_status(
  p_company_id UUID,
  p_status company_account_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_previous company_account_status;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_admin required' USING ERRCODE = '42501';
  END IF;

  SELECT account_status INTO v_previous
  FROM companies
  WHERE id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: company not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE companies
  SET
    account_status = p_status,
    suspended_at = CASE WHEN p_status = 'suspended'::company_account_status THEN NOW() ELSE NULL END,
    suspended_by = CASE WHEN p_status = 'suspended'::company_account_status THEN v_admin_id ELSE NULL END,
    suspension_reason = CASE WHEN p_status = 'suspended'::company_account_status THEN p_reason ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_company_id;

  INSERT INTO platform_admin_actions (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin_id,
    'company.status_changed',
    'company',
    p_company_id,
    jsonb_build_object(
      'company_id', p_company_id,
      'previous_status', v_previous,
      'new_status', p_status,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'company_id', p_company_id,
    'account_status', p_status
  );
END;
$$;

COMMENT ON FUNCTION public.platform_set_company_status IS
  'Suspend or reactivate a company account (platform_admin only); writes platform_admin_actions audit row';

-- ---------------------------------------------------------------------------
-- RPC: platform_extend_subscription
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.platform_extend_subscription(
  p_company_id UUID,
  p_new_expires_at TIMESTAMPTZ,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_sub subscriptions%ROWTYPE;
  v_new_status subscription_status;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_admin required' USING ERRCODE = '42501';
  END IF;

  IF p_new_expires_at IS NULL OR p_new_expires_at <= NOW() THEN
    RAISE EXCEPTION 'VALIDATION: p_new_expires_at must be in the future' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_sub
  FROM subscriptions
  WHERE company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: no subscription for company' USING ERRCODE = 'P0002';
  END IF;

  v_new_status := v_sub.status;
  IF v_sub.status IN ('expired', 'trialing') THEN
    v_new_status := 'active';
  END IF;

  UPDATE subscriptions
  SET
    status = v_new_status,
    expires_at = p_new_expires_at,
    next_renewal_at = p_new_expires_at,
    cancel_at_period_end = FALSE,
    cancelled_at = NULL,
    cancelled_by = NULL,
    updated_at = NOW()
  WHERE id = v_sub.id;

  INSERT INTO platform_admin_actions (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin_id,
    'subscription.extended',
    'subscription',
    v_sub.id,
    jsonb_build_object(
      'company_id', p_company_id,
      'previous_status', v_sub.status,
      'new_status', v_new_status,
      'previous_expires_at', v_sub.expires_at,
      'new_expires_at', p_new_expires_at,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'subscription_id', v_sub.id,
    'company_id', p_company_id,
    'status', v_new_status,
    'expires_at', p_new_expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.platform_extend_subscription IS
  'Manually extend subscription expiry (platform_admin only); may activate expired/trialing rows';

-- ---------------------------------------------------------------------------
-- RPC: platform_dashboard_stats
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.platform_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform staff required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_companies', (SELECT COUNT(*)::bigint FROM companies),
    'active_companies', (
      SELECT COUNT(*)::bigint
      FROM company_subscription_current csc
      WHERE csc.account_status = 'active'
        AND csc.subscription_status = 'active'
    ),
    'trialing_companies', (
      SELECT COUNT(*)::bigint
      FROM company_subscription_current csc
      WHERE csc.subscription_status = 'trialing'
    ),
    'expired_companies', (
      SELECT COUNT(*)::bigint
      FROM company_subscription_current csc
      WHERE csc.subscription_status = 'expired'
    ),
    'suspended_companies', (
      SELECT COUNT(*)::bigint
      FROM company_subscription_current csc
      WHERE csc.account_status = 'suspended'
        OR csc.subscription_status = 'suspended'
    ),
    'account_suspended_companies', (
      SELECT COUNT(*)::bigint
      FROM companies
      WHERE account_status = 'suspended'
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(amount), 0)::numeric
      FROM payments
      WHERE status = 'completed'
    ),
    'pending_payments', (
      SELECT COUNT(*)::bigint
      FROM payments
      WHERE status = 'pending'
    ),
    'generated_at', NOW()
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

COMMENT ON FUNCTION public.platform_dashboard_stats IS
  'Aggregate KPIs for platform admin dashboard (platform_admin and platform_support)';

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.platform_set_company_status(UUID, company_account_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_extend_subscription(UUID, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_dashboard_stats() TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: platform_support read parity on activity_logs
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can view activity logs" ON activity_logs;

CREATE POLICY "Members can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );
