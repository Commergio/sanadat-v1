-- Sanadat P1.7: document cancellation lifecycle

-- 1) Ensure cancelled_by exists on all document tables
ALTER TABLE receipt_vouchers
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);

ALTER TABLE payment_vouchers
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);

-- 2) Secure, tenant-scoped cancellation RPC functions
CREATE OR REPLACE FUNCTION public.cancel_receipt_voucher(
  p_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_status document_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(length(trim(p_reason)), 0) < 3 THEN
    RAISE EXCEPTION 'Validation error: cancel reason is required' USING ERRCODE = '22023';
  END IF;

  SELECT company_id, status
  INTO v_company_id, v_status
  FROM receipt_vouchers
  WHERE id = p_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Receipt voucher already cancelled' USING ERRCODE = '23505';
  END IF;

  UPDATE receipt_vouchers
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancel_reason = trim(p_reason),
    cancelled_by = auth.uid()
  WHERE id = p_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt voucher already cancelled' USING ERRCODE = '23505';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_payment_voucher(
  p_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_status document_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(length(trim(p_reason)), 0) < 3 THEN
    RAISE EXCEPTION 'Validation error: cancel reason is required' USING ERRCODE = '22023';
  END IF;

  SELECT company_id, status
  INTO v_company_id, v_status
  FROM payment_vouchers
  WHERE id = p_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Payment voucher not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Payment voucher already cancelled' USING ERRCODE = '23505';
  END IF;

  UPDATE payment_vouchers
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancel_reason = trim(p_reason),
    cancelled_by = auth.uid()
  WHERE id = p_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment voucher already cancelled' USING ERRCODE = '23505';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_invoice(
  p_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_status document_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(length(trim(p_reason)), 0) < 3 THEN
    RAISE EXCEPTION 'Validation error: cancel reason is required' USING ERRCODE = '22023';
  END IF;

  SELECT company_id, status
  INTO v_company_id, v_status
  FROM invoices
  WHERE id = p_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Invoice not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Invoice already cancelled' USING ERRCODE = '23505';
  END IF;

  UPDATE invoices
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancel_reason = trim(p_reason),
    cancelled_by = auth.uid()
  WHERE id = p_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice already cancelled' USING ERRCODE = '23505';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_receipt_voucher(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_payment_voucher(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_invoice(UUID, TEXT) TO authenticated;
