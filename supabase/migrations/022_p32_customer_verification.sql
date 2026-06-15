-- P3.2: Customer verification & signature link

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_token_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_ip INET,
  ADD COLUMN IF NOT EXISTS verified_user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_verification_token_hash
  ON customers(verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS customer_verification_tokens (
  token_hash TEXT PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_verification_tokens_customer
  ON customer_verification_tokens(customer_id);

ALTER TABLE customer_verification_tokens ENABLE ROW LEVEL SECURITY;
-- No tenant policies — public flow uses service-role API + SECURITY DEFINER RPCs

-- Store a new verification token (merchant, tenant-scoped)
CREATE OR REPLACE FUNCTION public.store_customer_verification_token(
  p_customer_id UUID,
  p_token_hash TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_token_hash IS NULL OR length(trim(p_token_hash)) < 16 THEN
    RAISE EXCEPTION 'Invalid token hash' USING ERRCODE = '22023';
  END IF;

  SELECT company_id INTO v_company_id FROM customers WHERE id = p_customer_id;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Customer not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_company_id, 'accountant') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- Invalidate prior unused tokens for this customer
  UPDATE customer_verification_tokens
  SET used_at = NOW()
  WHERE customer_id = p_customer_id AND used_at IS NULL;

  INSERT INTO customer_verification_tokens (token_hash, customer_id, company_id, expires_at)
  VALUES (p_token_hash, p_customer_id, v_company_id, p_expires_at);

  UPDATE customers
  SET
    verification_token_hash = p_token_hash,
    verification_sent_at = NOW(),
    verification_expires_at = p_expires_at,
    verification_token_used_at = NULL
  WHERE id = p_customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.store_customer_verification_token(UUID, TEXT, TIMESTAMPTZ) TO authenticated;

-- Public read payload by token hash (no auth)
CREATE OR REPLACE FUNCTION public.get_customer_verification_by_hash(p_token_hash TEXT)
RETURNS TABLE (
  customer_id UUID,
  company_id UUID,
  company_name TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  is_verified BOOLEAN,
  token_valid BOOLEAN,
  token_expired BOOLEAN,
  token_used BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row customer_verification_tokens%ROWTYPE;
  v_customer customers%ROWTYPE;
  v_company companies%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR length(trim(p_token_hash)) < 16 THEN
    RETURN;
  END IF;

  SELECT * INTO v_row
  FROM customer_verification_tokens
  WHERE token_hash = p_token_hash;

  IF v_row.token_hash IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_customer FROM customers WHERE id = v_row.customer_id;
  IF v_customer.id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_company FROM companies WHERE id = v_row.company_id;

  customer_id := v_customer.id;
  company_id := v_company.id;
  company_name := v_company.name;
  customer_name := v_customer.name;
  customer_phone := v_customer.phone;
  is_verified := v_customer.is_verified;
  token_used := v_row.used_at IS NOT NULL OR v_customer.verification_token_used_at IS NOT NULL;
  token_expired := v_row.expires_at < NOW();
  token_valid := NOT token_used AND NOT token_expired;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_verification_by_hash(TEXT) TO anon, authenticated, service_role;

-- Complete verification with signature path (public, token hash)
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

GRANT EXECUTE ON FUNCTION public.complete_customer_verification(TEXT, TEXT, INET, TEXT) TO anon, authenticated, service_role;
