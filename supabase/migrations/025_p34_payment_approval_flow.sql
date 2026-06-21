-- P3.4: Payment voucher customer approval flow (payment vouchers only)

-- ─── 1. Draft payments without official numbers ─────────────────────────────

ALTER TABLE payment_vouchers ALTER COLUMN number DROP NOT NULL;
ALTER TABLE payment_vouchers ALTER COLUMN display_number DROP NOT NULL;

ALTER TABLE payment_vouchers DROP CONSTRAINT IF EXISTS payment_vouchers_company_id_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_vouchers_issued_company_number
  ON payment_vouchers(company_id, number)
  WHERE lifecycle_status = 'issued' AND number IS NOT NULL;

-- ─── 2. Send payment for customer approval ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.send_payment_for_approval(
  p_payment_id UUID,
  p_token_hash TEXT,
  p_expires_at TIMESTAMPTZ,
  p_snapshot JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_lifecycle document_lifecycle_status;
  v_customer_id UUID;
  v_version INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(length(trim(p_token_hash)), 0) < 16 THEN
    RAISE EXCEPTION 'Invalid approval token hash' USING ERRCODE = '22023';
  END IF;

  SELECT company_id, lifecycle_status, customer_id, COALESCE(approval_snapshot_version, 0)
  INTO v_company_id, v_lifecycle, v_customer_id, v_version
  FROM payment_vouchers
  WHERE id = p_payment_id
  FOR UPDATE;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Payment voucher not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_lifecycle <> 'draft' THEN
    RAISE EXCEPTION 'Payment must be in draft status to send for approval' USING ERRCODE = '22023';
  END IF;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Payment must be linked to a customer' USING ERRCODE = '22023';
  END IF;

  v_version := v_version + 1;

  INSERT INTO document_approval_snapshots (
    company_id, document_type, document_id, version, payload
  ) VALUES (
    v_company_id, 'payment_voucher', p_payment_id, v_version, p_snapshot
  )
  ON CONFLICT (document_type, document_id, version)
  DO UPDATE SET payload = EXCLUDED.payload;

  INSERT INTO document_approval_tokens (
    token_hash, company_id, document_type, document_id, expires_at
  ) VALUES (
    p_token_hash, v_company_id, 'payment_voucher', p_payment_id, p_expires_at
  )
  ON CONFLICT (token_hash) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval token already exists' USING ERRCODE = '23505';
  END IF;

  UPDATE payment_vouchers
  SET
    lifecycle_status = 'pending_approval',
    approval_token_hash = p_token_hash,
    approval_sent_at = NOW(),
    approval_expires_at = p_expires_at,
    approval_token_used_at = NULL,
    content_locked_at = NOW(),
    approval_snapshot_version = v_version
  WHERE id = p_payment_id;

  RETURN jsonb_build_object(
    'payment_id', p_payment_id,
    'company_id', v_company_id,
    'customer_id', v_customer_id,
    'snapshot_version', v_version
  );
END;
$$;

-- ─── 3. Load approval payload by token (public) ─────────────────────────────

CREATE OR REPLACE FUNCTION public.get_payment_approval_by_hash(p_token_hash TEXT)
RETURNS TABLE (
  payment_id UUID,
  company_id UUID,
  company_name TEXT,
  company_name_en TEXT,
  company_phone TEXT,
  company_cr_number TEXT,
  company_vat_number TEXT,
  company_address TEXT,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_verified BOOLEAN,
  customer_signature_path TEXT,
  lifecycle_status document_lifecycle_status,
  snapshot_payload JSONB,
  token_expires_at TIMESTAMPTZ,
  token_used_at TIMESTAMPTZ,
  token_expired BOOLEAN,
  token_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token document_approval_tokens%ROWTYPE;
  v_payment payment_vouchers%ROWTYPE;
  v_company companies%ROWTYPE;
  v_customer customers%ROWTYPE;
  v_snapshot document_approval_snapshots%ROWTYPE;
BEGIN
  SELECT * INTO v_token
  FROM document_approval_tokens
  WHERE token_hash = p_token_hash
    AND document_type = 'payment_voucher';

  IF v_token.token_hash IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_payment FROM payment_vouchers WHERE id = v_token.document_id;
  IF v_payment.id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_company FROM companies WHERE id = v_token.company_id;
  SELECT * INTO v_customer FROM customers WHERE id = v_payment.customer_id;

  SELECT * INTO v_snapshot
  FROM document_approval_snapshots
  WHERE document_type = 'payment_voucher'
    AND document_id = v_payment.id
    AND version = v_payment.approval_snapshot_version;

  payment_id := v_payment.id;
  company_id := v_company.id;
  company_name := v_company.name;
  company_name_en := v_company.name_en;
  company_phone := v_company.phone;
  company_cr_number := v_company.cr_number;
  company_vat_number := v_company.vat_number;
  company_address := v_company.address;
  customer_id := v_customer.id;
  customer_name := COALESCE(v_customer.name, v_payment.party_name);
  customer_phone := v_customer.phone;
  customer_verified := COALESCE(v_customer.is_verified, false);
  customer_signature_path := v_customer.default_signature_path;
  lifecycle_status := v_payment.lifecycle_status;
  snapshot_payload := COALESCE(v_snapshot.payload, '{}'::jsonb);
  token_expires_at := v_token.expires_at;
  token_used_at := v_token.used_at;
  token_expired := v_token.expires_at IS NOT NULL AND v_token.expires_at < NOW();
  token_valid := v_token.used_at IS NULL
    AND NOT (v_token.expires_at IS NOT NULL AND v_token.expires_at < NOW())
    AND v_payment.lifecycle_status = 'pending_approval';

  RETURN NEXT;
END;
$$;

-- ─── 4. Approve payment by token (public) ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.approve_payment_by_hash(
  p_token_hash TEXT,
  p_signature_path TEXT,
  p_approved_by_name TEXT,
  p_approved_by_phone TEXT,
  p_ip TEXT,
  p_user_agent TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token document_approval_tokens%ROWTYPE;
  v_payment payment_vouchers%ROWTYPE;
  v_next_number INTEGER;
  v_display_number TEXT;
BEGIN
  IF COALESCE(length(trim(p_token_hash)), 0) < 16 THEN
    RAISE EXCEPTION 'Invalid approval token' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_token
  FROM document_approval_tokens
  WHERE token_hash = p_token_hash
    AND document_type = 'payment_voucher'
  FOR UPDATE;

  IF v_token.token_hash IS NULL THEN
    RAISE EXCEPTION 'Approval link not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_token.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Approval link already used' USING ERRCODE = '23505';
  END IF;

  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < NOW() THEN
    RAISE EXCEPTION 'Approval link expired' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_payment
  FROM payment_vouchers
  WHERE id = v_token.document_id
  FOR UPDATE;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Payment voucher not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_payment.lifecycle_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Payment is not pending approval' USING ERRCODE = '23505';
  END IF;

  IF COALESCE(length(trim(p_signature_path)), 0) < 3 THEN
    RAISE EXCEPTION 'Customer signature is required' USING ERRCODE = '22023';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE token_hash = p_token_hash;

  SELECT gn.number, gn.display_number
  INTO v_next_number, v_display_number
  FROM get_next_document_number(v_payment.company_id, 'payment_voucher', 'صرف') AS gn;

  UPDATE payment_vouchers
  SET
    lifecycle_status = 'issued',
    status = 'active',
    number = v_next_number,
    display_number = v_display_number,
    issued_at = NOW(),
    approved_at = NOW(),
    approved_by_name = NULLIF(trim(p_approved_by_name), ''),
    approved_by_phone = NULLIF(trim(p_approved_by_phone), ''),
    customer_signature_path = p_signature_path,
    approval_ip = public.safe_inet_from_text(p_ip),
    approval_user_agent = NULLIF(trim(p_user_agent), ''),
    approval_token_used_at = NOW()
  WHERE id = v_payment.id;

  RETURN jsonb_build_object(
    'payment_id', v_payment.id,
    'company_id', v_payment.company_id,
    'display_number', v_display_number
  );
END;
$$;

-- ─── 5. Reject payment by token (public) ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reject_payment_by_hash(
  p_token_hash TEXT,
  p_reason TEXT,
  p_ip TEXT,
  p_user_agent TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token document_approval_tokens%ROWTYPE;
  v_payment payment_vouchers%ROWTYPE;
BEGIN
  IF COALESCE(length(trim(p_token_hash)), 0) < 16 THEN
    RAISE EXCEPTION 'Invalid approval token' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(length(trim(p_reason)), 0) < 3 THEN
    RAISE EXCEPTION 'Rejection reason is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_token
  FROM document_approval_tokens
  WHERE token_hash = p_token_hash
    AND document_type = 'payment_voucher'
  FOR UPDATE;

  IF v_token.token_hash IS NULL THEN
    RAISE EXCEPTION 'Approval link not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_token.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Approval link already used' USING ERRCODE = '23505';
  END IF;

  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < NOW() THEN
    RAISE EXCEPTION 'Approval link expired' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_payment
  FROM payment_vouchers
  WHERE id = v_token.document_id
  FOR UPDATE;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Payment voucher not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_payment.lifecycle_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Payment is not pending approval' USING ERRCODE = '23505';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE token_hash = p_token_hash;

  UPDATE payment_vouchers
  SET
    lifecycle_status = 'rejected',
    rejection_reason = trim(p_reason),
    rejected_at = NOW(),
    approval_ip = public.safe_inet_from_text(p_ip),
    approval_user_agent = NULLIF(trim(p_user_agent), ''),
    approval_token_used_at = NOW()
  WHERE id = v_payment.id;

  RETURN jsonb_build_object(
    'payment_id', v_payment.id,
    'company_id', v_payment.company_id
  );
END;
$$;

-- ─── 6. Allow cancelling draft / pending / rejected payments ────────────────

CREATE OR REPLACE FUNCTION public.cancel_payment_voucher(p_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id UUID;
  v_status document_status;
  v_lifecycle document_lifecycle_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501'; END IF;
  IF COALESCE(length(trim(p_reason)), 0) < 3 THEN
    RAISE EXCEPTION 'Validation error: cancel reason is required' USING ERRCODE = '22023';
  END IF;
  SELECT company_id, status, lifecycle_status
  INTO v_company_id, v_status, v_lifecycle
  FROM payment_vouchers WHERE id = p_id;
  IF v_company_id IS NULL THEN RAISE EXCEPTION 'Payment voucher not found' USING ERRCODE = 'P0001'; END IF;
  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF v_status = 'cancelled' OR v_lifecycle = 'cancelled' THEN
    RAISE EXCEPTION 'Payment voucher already cancelled' USING ERRCODE = '23505';
  END IF;
  IF v_lifecycle = 'issued' AND v_status <> 'active' THEN
    RAISE EXCEPTION 'Payment voucher already cancelled' USING ERRCODE = '23505';
  END IF;
  UPDATE payment_vouchers SET
    status = 'cancelled',
    lifecycle_status = 'cancelled',
    cancelled_at = NOW(),
    cancel_reason = trim(p_reason),
    cancelled_by = auth.uid()
  WHERE id = p_id
    AND status = 'active'
    AND lifecycle_status IN ('draft', 'pending_approval', 'rejected', 'issued');
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment voucher already cancelled' USING ERRCODE = '23505'; END IF;
END; $$;

GRANT EXECUTE ON FUNCTION public.send_payment_for_approval(UUID, TEXT, TIMESTAMPTZ, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_approval_by_hash(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_payment_by_hash(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_payment_by_hash(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
