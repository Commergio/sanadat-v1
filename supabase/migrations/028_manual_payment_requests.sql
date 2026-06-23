-- P3.6: Manual bank transfer payment review

-- ─── 1. Status enum + table ─────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE manual_payment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS manual_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'SAR',
  plan_code TEXT NOT NULL,
  billing_cycle billing_cycle NOT NULL DEFAULT 'yearly',
  proof_file_path TEXT NOT NULL,
  status manual_payment_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE manual_payment_requests IS 'Tenant-submitted bank transfer proofs awaiting platform review';

CREATE INDEX IF NOT EXISTS idx_manual_payment_requests_company
  ON manual_payment_requests(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manual_payment_requests_status
  ON manual_payment_requests(status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_payment_one_pending_per_company
  ON manual_payment_requests(company_id)
  WHERE status = 'pending';

-- ─── 2. RLS ───────────────────────────────────────────────────────────────

ALTER TABLE manual_payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read own manual payment requests"
  ON manual_payment_requests FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Tenant admin insert manual payment requests"
  ON manual_payment_requests FOR INSERT
  WITH CHECK (
    public.user_has_company_role(company_id, 'admin')
    AND requested_by = auth.uid()
    AND status = 'pending'
  );

-- Updates via service role / SECURITY DEFINER only (approve/reject APIs)

CREATE POLICY "Platform staff read all manual payment requests"
  ON manual_payment_requests FOR SELECT
  USING (public.is_platform_admin() OR public.is_platform_support());

-- ─── 3. Storage bucket: payment-proofs (private) ────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No tenant storage policies — uploads/downloads via service-role API routes only.

-- ─── 4. Approve manual payment (platform admin) ───────────────────────────

CREATE OR REPLACE FUNCTION public.platform_approve_manual_payment(
  p_request_id UUID,
  p_payment_id UUID,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request manual_payment_requests%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_admin required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_request
  FROM manual_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Manual payment request not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Manual payment request is not pending' USING ERRCODE = '23505';
  END IF;

  UPDATE manual_payment_requests
  SET
    status = 'approved',
    admin_note = NULLIF(trim(p_admin_note), ''),
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  INSERT INTO platform_admin_actions (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'manual_payment.approved',
    'manual_payment_request',
    p_request_id,
    jsonb_build_object(
      'company_id', v_request.company_id,
      'payment_id', p_payment_id,
      'amount', v_request.amount,
      'currency', v_request.currency
    )
  );

  RETURN jsonb_build_object(
    'request_id', p_request_id,
    'company_id', v_request.company_id,
    'payment_id', p_payment_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_reject_manual_payment(
  p_request_id UUID,
  p_admin_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request manual_payment_requests%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_admin required' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(length(trim(p_admin_note)), 0) < 3 THEN
    RAISE EXCEPTION 'Rejection note is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_request
  FROM manual_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Manual payment request not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Manual payment request is not pending' USING ERRCODE = '23505';
  END IF;

  UPDATE manual_payment_requests
  SET
    status = 'rejected',
    admin_note = trim(p_admin_note),
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  INSERT INTO platform_admin_actions (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'manual_payment.rejected',
    'manual_payment_request',
    p_request_id,
    jsonb_build_object(
      'company_id', v_request.company_id,
      'admin_note', trim(p_admin_note)
    )
  );

  RETURN jsonb_build_object(
    'request_id', p_request_id,
    'company_id', v_request.company_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.platform_approve_manual_payment(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_reject_manual_payment(UUID, TEXT) TO authenticated;
