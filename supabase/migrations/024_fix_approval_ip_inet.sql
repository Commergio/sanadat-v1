-- Fix approval_ip / verified_ip INET assignments (text → inet mismatch)

CREATE OR REPLACE FUNCTION public.safe_inet_from_text(p_value TEXT)
RETURNS INET
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_value IS NULL OR length(trim(p_value)) = 0 THEN
    RETURN NULL;
  END IF;
  RETURN trim(p_value)::inet;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Receipt approval: cast text IP safely before writing to approval_ip (INET)
CREATE OR REPLACE FUNCTION public.approve_receipt_by_hash(
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
  v_receipt receipt_vouchers%ROWTYPE;
  v_next_number INTEGER;
  v_display_number TEXT;
BEGIN
  IF COALESCE(length(trim(p_token_hash)), 0) < 16 THEN
    RAISE EXCEPTION 'Invalid approval token' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_token
  FROM document_approval_tokens
  WHERE token_hash = p_token_hash
    AND document_type = 'receipt_voucher'
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

  SELECT * INTO v_receipt
  FROM receipt_vouchers
  WHERE id = v_token.document_id
  FOR UPDATE;

  IF v_receipt.id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_receipt.lifecycle_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Receipt is not pending approval' USING ERRCODE = '23505';
  END IF;

  IF COALESCE(length(trim(p_signature_path)), 0) < 3 THEN
    RAISE EXCEPTION 'Customer signature is required' USING ERRCODE = '22023';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE token_hash = p_token_hash;

  SELECT gn.number, gn.display_number
  INTO v_next_number, v_display_number
  FROM get_next_document_number(v_receipt.company_id, 'receipt_voucher', 'قبض') AS gn;

  UPDATE receipt_vouchers
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
  WHERE id = v_receipt.id;

  RETURN jsonb_build_object(
    'receipt_id', v_receipt.id,
    'company_id', v_receipt.company_id,
    'display_number', v_display_number
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_receipt_by_hash(
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
  v_receipt receipt_vouchers%ROWTYPE;
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
    AND document_type = 'receipt_voucher'
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

  SELECT * INTO v_receipt
  FROM receipt_vouchers
  WHERE id = v_token.document_id
  FOR UPDATE;

  IF v_receipt.id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_receipt.lifecycle_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Receipt is not pending approval' USING ERRCODE = '23505';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE token_hash = p_token_hash;

  UPDATE receipt_vouchers
  SET
    lifecycle_status = 'rejected',
    rejection_reason = trim(p_reason),
    rejected_at = NOW(),
    approval_ip = public.safe_inet_from_text(p_ip),
    approval_user_agent = NULLIF(trim(p_user_agent), ''),
    approval_token_used_at = NOW()
  WHERE id = v_receipt.id;

  RETURN jsonb_build_object(
    'receipt_id', v_receipt.id,
    'company_id', v_receipt.company_id
  );
END;
$$;

-- Customer verification: accept TEXT IP and store safely as INET
CREATE OR REPLACE FUNCTION public.complete_customer_verification(
  p_token_hash TEXT,
  p_signature_path TEXT,
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row customer_verification_tokens%ROWTYPE;
  v_customer customers%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR length(trim(p_token_hash)) < 16 THEN
    RAISE EXCEPTION 'Invalid verification token' USING ERRCODE = 'P0001';
  END IF;

  IF p_signature_path IS NULL OR length(trim(p_signature_path)) < 3 THEN
    RAISE EXCEPTION 'Signature path is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
  FROM customer_verification_tokens
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF v_row.token_hash IS NULL THEN
    RAISE EXCEPTION 'Verification link not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_row.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Verification link already used' USING ERRCODE = '23505';
  END IF;

  IF v_row.expires_at < NOW() THEN
    RAISE EXCEPTION 'Verification link expired' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_customer FROM customers WHERE id = v_row.customer_id FOR UPDATE;
  IF v_customer.id IS NULL THEN
    RAISE EXCEPTION 'Customer not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_customer.verification_token_used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Customer already verified via this link' USING ERRCODE = '23505';
  END IF;

  IF v_customer.is_verified THEN
    RAISE EXCEPTION 'Customer already verified' USING ERRCODE = '23505';
  END IF;

  UPDATE customer_verification_tokens
  SET used_at = NOW()
  WHERE token_hash = p_token_hash;

  UPDATE customers
  SET
    is_verified = TRUE,
    verified_at = NOW(),
    default_signature_path = p_signature_path,
    verified_ip = p_ip,
    verified_user_agent = p_user_agent,
    verification_token_used_at = NOW()
  WHERE id = v_row.customer_id;

  RETURN v_row.customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.safe_inet_from_text(TEXT) TO anon, authenticated, service_role;
