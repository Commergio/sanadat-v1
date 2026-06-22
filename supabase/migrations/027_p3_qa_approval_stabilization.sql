-- P3 QA: resend approval from pending_approval + invalidate tokens on cancel/resend

-- ─── Receipt: send for approval (allow resend) ──────────────────────────────

CREATE OR REPLACE FUNCTION public.send_receipt_for_approval(
  p_receipt_id UUID,
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
  FROM receipt_vouchers
  WHERE id = p_receipt_id
  FOR UPDATE;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_lifecycle NOT IN ('draft', 'pending_approval') THEN
    RAISE EXCEPTION 'Receipt must be in draft or pending approval to send for approval' USING ERRCODE = '22023';
  END IF;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Receipt must be linked to a customer' USING ERRCODE = '22023';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE document_type = 'receipt_voucher'
    AND document_id = p_receipt_id
    AND used_at IS NULL;

  v_version := v_version + 1;

  INSERT INTO document_approval_snapshots (
    company_id, document_type, document_id, version, payload
  ) VALUES (
    v_company_id, 'receipt_voucher', p_receipt_id, v_version, p_snapshot
  )
  ON CONFLICT (document_type, document_id, version)
  DO UPDATE SET payload = EXCLUDED.payload;

  INSERT INTO document_approval_tokens (
    token_hash, company_id, document_type, document_id, expires_at
  ) VALUES (
    p_token_hash, v_company_id, 'receipt_voucher', p_receipt_id, p_expires_at
  )
  ON CONFLICT (token_hash) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval token already exists' USING ERRCODE = '23505';
  END IF;

  UPDATE receipt_vouchers
  SET
    lifecycle_status = 'pending_approval',
    approval_token_hash = p_token_hash,
    approval_sent_at = NOW(),
    approval_expires_at = p_expires_at,
    approval_token_used_at = NULL,
    content_locked_at = NOW(),
    approval_snapshot_version = v_version
  WHERE id = p_receipt_id;

  RETURN jsonb_build_object(
    'receipt_id', p_receipt_id,
    'company_id', v_company_id,
    'customer_id', v_customer_id,
    'snapshot_version', v_version
  );
END;
$$;

-- ─── Payment: send for approval (allow resend) ──────────────────────────────

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

  IF v_lifecycle NOT IN ('draft', 'pending_approval') THEN
    RAISE EXCEPTION 'Payment must be in draft or pending approval to send for approval' USING ERRCODE = '22023';
  END IF;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Payment must be linked to a customer' USING ERRCODE = '22023';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE document_type = 'payment_voucher'
    AND document_id = p_payment_id
    AND used_at IS NULL;

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

-- ─── Invoice: send for approval (allow resend) ──────────────────────────────

CREATE OR REPLACE FUNCTION public.send_invoice_for_approval(
  p_invoice_id UUID,
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
  FROM invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Invoice not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_lifecycle NOT IN ('draft', 'pending_approval') THEN
    RAISE EXCEPTION 'Invoice must be in draft or pending approval to send for approval' USING ERRCODE = '22023';
  END IF;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Invoice must be linked to a customer' USING ERRCODE = '22023';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE document_type = 'invoice'
    AND document_id = p_invoice_id
    AND used_at IS NULL;

  v_version := v_version + 1;

  INSERT INTO document_approval_snapshots (
    company_id, document_type, document_id, version, payload
  ) VALUES (
    v_company_id, 'invoice', p_invoice_id, v_version, p_snapshot
  )
  ON CONFLICT (document_type, document_id, version)
  DO UPDATE SET payload = EXCLUDED.payload;

  INSERT INTO document_approval_tokens (
    token_hash, company_id, document_type, document_id, expires_at
  ) VALUES (
    p_token_hash, v_company_id, 'invoice', p_invoice_id, p_expires_at
  )
  ON CONFLICT (token_hash) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval token already exists' USING ERRCODE = '23505';
  END IF;

  UPDATE invoices
  SET
    lifecycle_status = 'pending_approval',
    approval_token_hash = p_token_hash,
    approval_sent_at = NOW(),
    approval_expires_at = p_expires_at,
    approval_token_used_at = NULL,
    content_locked_at = NOW(),
    approval_snapshot_version = v_version
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'invoice_id', p_invoice_id,
    'company_id', v_company_id,
    'customer_id', v_customer_id,
    'snapshot_version', v_version
  );
END;
$$;

-- ─── Cancel: invalidate outstanding approval tokens ─────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_receipt_voucher(p_id UUID, p_reason TEXT)
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
  FROM receipt_vouchers WHERE id = p_id;
  IF v_company_id IS NULL THEN RAISE EXCEPTION 'Receipt voucher not found' USING ERRCODE = 'P0001'; END IF;
  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF v_status = 'cancelled' OR v_lifecycle = 'cancelled' THEN
    RAISE EXCEPTION 'Receipt voucher already cancelled' USING ERRCODE = '23505';
  END IF;
  IF v_lifecycle = 'issued' AND v_status <> 'active' THEN
    RAISE EXCEPTION 'Receipt voucher already cancelled' USING ERRCODE = '23505';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE document_type = 'receipt_voucher'
    AND document_id = p_id
    AND used_at IS NULL;

  UPDATE receipt_vouchers SET
    status = 'cancelled',
    lifecycle_status = 'cancelled',
    cancelled_at = NOW(),
    cancel_reason = trim(p_reason),
    cancelled_by = auth.uid()
  WHERE id = p_id
    AND status = 'active'
    AND lifecycle_status IN ('draft', 'pending_approval', 'rejected', 'issued');
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt voucher already cancelled' USING ERRCODE = '23505'; END IF;
END; $$;

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

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE document_type = 'payment_voucher'
    AND document_id = p_id
    AND used_at IS NULL;

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

CREATE OR REPLACE FUNCTION public.cancel_invoice(p_id UUID, p_reason TEXT)
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
  FROM invoices WHERE id = p_id;
  IF v_company_id IS NULL THEN RAISE EXCEPTION 'Invoice not found' USING ERRCODE = 'P0001'; END IF;
  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF v_status = 'cancelled' OR v_lifecycle = 'cancelled' THEN
    RAISE EXCEPTION 'Invoice already cancelled' USING ERRCODE = '23505';
  END IF;
  IF v_lifecycle = 'issued' AND v_status <> 'active' THEN
    RAISE EXCEPTION 'Invoice already cancelled' USING ERRCODE = '23505';
  END IF;

  UPDATE document_approval_tokens
  SET used_at = NOW()
  WHERE document_type = 'invoice'
    AND document_id = p_id
    AND used_at IS NULL;

  UPDATE invoices SET
    status = 'cancelled',
    lifecycle_status = 'cancelled',
    cancelled_at = NOW(),
    cancel_reason = trim(p_reason),
    cancelled_by = auth.uid()
  WHERE id = p_id
    AND status = 'active'
    AND lifecycle_status IN ('draft', 'pending_approval', 'rejected', 'issued');
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice already cancelled' USING ERRCODE = '23505'; END IF;
END; $$;
