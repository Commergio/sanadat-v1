-- Sanadat P0: RLS helper functions and membership-based policies

-- ─── Helper functions (public schema — callable from RLS) ───────────────────

CREATE OR REPLACE FUNCTION public.user_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM company_members
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND platform_role = 'platform_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_support()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND platform_role = 'platform_support'
  );
$$;

CREATE OR REPLACE FUNCTION public.tenant_role_rank(p_role tenant_role)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'accountant' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_company_role(
  p_company_id UUID,
  p_min_role tenant_role DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role tenant_role;
BEGIN
  IF public.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  SELECT role INTO v_role
  FROM company_members
  WHERE company_id = p_company_id AND user_id = auth.uid();

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN public.tenant_role_rank(v_role) >= public.tenant_role_rank(p_min_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_company_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_support() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_company_role(UUID, tenant_role) TO authenticated;

-- ─── Drop legacy MVP policies (user_id on companies) ───────────────────────────

DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert own companies" ON companies;
DROP POLICY IF EXISTS "Users can update own companies" ON companies;

DROP POLICY IF EXISTS "Users can view own receipts" ON receipt_vouchers;
DROP POLICY IF EXISTS "Users can insert own receipts" ON receipt_vouchers;

DROP POLICY IF EXISTS "Users can view own payments" ON payment_vouchers;
DROP POLICY IF EXISTS "Users can insert own payments" ON payment_vouchers;

DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;

DROP POLICY IF EXISTS "Users can view own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can insert own invoice items" ON invoice_items;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Users can view own activity" ON activity_logs;

-- ─── Companies ─────────────────────────────────────────────────────────────────

CREATE POLICY "Members can view companies"
  ON companies FOR SELECT
  USING (
    id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Users can insert own company on signup"
  ON companies FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Admins can update company"
  ON companies FOR UPDATE
  USING (public.user_has_company_role(id, 'admin'));

-- ─── Company members ─────────────────────────────────────────────────────────

CREATE POLICY "Members can view memberships in their companies"
  ON company_members FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Admins can insert memberships"
  ON company_members FOR INSERT
  WITH CHECK (public.user_has_company_role(company_id, 'admin'));

CREATE POLICY "Admins can update memberships"
  ON company_members FOR UPDATE
  USING (public.user_has_company_role(company_id, 'admin'));

CREATE POLICY "Admins can delete memberships"
  ON company_members FOR DELETE
  USING (
    public.user_has_company_role(company_id, 'admin')
    AND role <> 'owner'
  );

-- ─── Company invitations ─────────────────────────────────────────────────────

CREATE POLICY "Admins can view invitations"
  ON company_invitations FOR SELECT
  USING (public.user_has_company_role(company_id, 'admin'));

CREATE POLICY "Admins can create invitations"
  ON company_invitations FOR INSERT
  WITH CHECK (public.user_has_company_role(company_id, 'admin'));

CREATE POLICY "Admins can update invitations"
  ON company_invitations FOR UPDATE
  USING (public.user_has_company_role(company_id, 'admin'));

-- ─── Document tables (P1 will use; RLS ready now) ─────────────────────────────

CREATE POLICY "Members can view receipts"
  ON receipt_vouchers FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Accountants can insert receipts"
  ON receipt_vouchers FOR INSERT
  WITH CHECK (public.user_has_company_role(company_id, 'accountant'));

CREATE POLICY "Members can view payment vouchers"
  ON payment_vouchers FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Accountants can insert payment vouchers"
  ON payment_vouchers FOR INSERT
  WITH CHECK (public.user_has_company_role(company_id, 'accountant'));

CREATE POLICY "Members can view invoices"
  ON invoices FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Accountants can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (public.user_has_company_role(company_id, 'accountant'));

CREATE POLICY "Members can view invoice items"
  ON invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE company_id IN (SELECT public.user_company_ids())
    )
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Accountants can insert invoice items"
  ON invoice_items FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE public.user_has_company_role(company_id, 'accountant')
    )
  );

-- ─── Subscriptions, sequences, activity, payments (read for members) ─────────

CREATE POLICY "Members can view subscriptions"
  ON subscriptions FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
  );

CREATE POLICY "Members can view document sequences"
  ON document_sequences FOR SELECT
  USING (company_id IN (SELECT public.user_company_ids()));

CREATE POLICY "Members can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
  );

CREATE POLICY "Members can view billing payments"
  ON payments FOR SELECT
  USING (company_id IN (SELECT public.user_company_ids()));

-- Profiles: extend SELECT for platform staff (replaces MVP own-only read)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users and platform staff can view profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );
