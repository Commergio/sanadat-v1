-- P3.1: Customers & document approval foundation (schema only — flow wired in later phases)
--
-- If this migration deadlocks on a live database, run 021_p31_approval_foundation_idempotent.sql
-- instead (idempotent, shorter locks). Pause app traffic during DDL when possible.

SET lock_timeout = '60s';
SET statement_timeout = '10min';

-- ─── 1. Customers ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  national_id TEXT,
  default_signature_path TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT customers_phone_not_empty CHECK (length(trim(phone)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_company_phone ON customers(company_id, phone);

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 2. Document lifecycle enum ─────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_lifecycle_status') THEN
    CREATE TYPE document_lifecycle_status AS ENUM (
      'draft',
      'pending_approval',
      'approved',
      'issued',
      'rejected',
      'cancelled'
    );
  END IF;
END $$;

-- Columns without inline FK (reduces deadlock risk with live readers)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['receipt_vouchers', 'payment_vouchers', 'invoices']
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS lifecycle_status document_lifecycle_status NOT NULL DEFAULT ''issued''', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS customer_id UUID', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approval_token_hash TEXT', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approval_sent_at TIMESTAMPTZ', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approval_expires_at TIMESTAMPTZ', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approval_token_used_at TIMESTAMPTZ', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approved_by_name TEXT', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approved_by_phone TEXT', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS customer_signature_path TEXT', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approval_ip INET', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approval_user_agent TEXT', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS rejection_reason TEXT', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS issued_by UUID', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS approval_snapshot_version INTEGER NOT NULL DEFAULT 1', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS content_locked_at TIMESTAMPTZ', t);
  END LOOP;
END $$;

DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN
    SELECT unnest(ARRAY['receipt_vouchers', 'payment_vouchers', 'invoices']) AS tbl,
           unnest(ARRAY[
             'receipt_vouchers_customer_id_fkey',
             'payment_vouchers_customer_id_fkey',
             'invoices_customer_id_fkey'
           ]) AS cname
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = rec.cname) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL NOT VALID',
        rec.tbl, rec.cname
      );
      EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', rec.tbl, rec.cname);
    END IF;
  END LOOP;

  FOR rec IN
    SELECT unnest(ARRAY['receipt_vouchers', 'payment_vouchers', 'invoices']) AS tbl,
           unnest(ARRAY[
             'receipt_vouchers_issued_by_fkey',
             'payment_vouchers_issued_by_fkey',
             'invoices_issued_by_fkey'
           ]) AS cname
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = rec.cname) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (issued_by) REFERENCES profiles(id) NOT VALID',
        rec.tbl, rec.cname
      );
      EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', rec.tbl, rec.cname);
    END IF;
  END LOOP;
END $$;

-- Backfill cancelled rows only (issued is already the column default)
UPDATE receipt_vouchers SET lifecycle_status = 'cancelled' WHERE status = 'cancelled' AND lifecycle_status <> 'cancelled';
UPDATE payment_vouchers SET lifecycle_status = 'cancelled' WHERE status = 'cancelled' AND lifecycle_status <> 'cancelled';
UPDATE invoices SET lifecycle_status = 'cancelled' WHERE status = 'cancelled' AND lifecycle_status <> 'cancelled';

-- Backfill issued_at for existing issued documents
UPDATE receipt_vouchers SET issued_at = created_at WHERE lifecycle_status = 'issued' AND issued_at IS NULL;
UPDATE payment_vouchers SET issued_at = created_at WHERE lifecycle_status = 'issued' AND issued_at IS NULL;
UPDATE invoices SET issued_at = created_at WHERE lifecycle_status = 'issued' AND issued_at IS NULL;

-- Backfill issued_by from created_by where available
UPDATE receipt_vouchers SET issued_by = created_by WHERE lifecycle_status = 'issued' AND issued_by IS NULL AND created_by IS NOT NULL;
UPDATE payment_vouchers SET issued_by = created_by WHERE lifecycle_status = 'issued' AND issued_by IS NULL AND created_by IS NOT NULL;
UPDATE invoices SET issued_by = created_by WHERE lifecycle_status = 'issued' AND issued_by IS NULL AND created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receipt_vouchers_lifecycle ON receipt_vouchers(company_id, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_payment_vouchers_lifecycle ON payment_vouchers(company_id, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_invoices_lifecycle ON invoices(company_id, lifecycle_status);

CREATE INDEX IF NOT EXISTS idx_receipt_vouchers_customer ON receipt_vouchers(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_vouchers_customer ON payment_vouchers(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id) WHERE customer_id IS NOT NULL;

-- ─── 3. Approval snapshots ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS document_approval_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('receipt_voucher', 'payment_voucher', 'invoice')),
  document_id UUID NOT NULL,
  version INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_type, document_id, version)
);

CREATE INDEX IF NOT EXISTS idx_document_approval_snapshots_company ON document_approval_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_document_approval_snapshots_document ON document_approval_snapshots(document_type, document_id);

-- ─── 4. Approval tokens (lookup by hash — no direct tenant access) ──────────

CREATE TABLE IF NOT EXISTS document_approval_tokens (
  token_hash TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('receipt_voucher', 'payment_voucher', 'invoice')),
  document_id UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_approval_tokens_document ON document_approval_tokens(document_type, document_id);

-- ─── 5. Storage: document-signatures (private) ────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-signatures',
  'document-signatures',
  false,
  524288,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No public or tenant storage policies — uploads via service-role API in P3.4+

-- ─── 6. RLS: customers ────────────────────────────────────────────────────

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view customers" ON customers;
CREATE POLICY "Members can view customers"
  ON customers FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

DROP POLICY IF EXISTS "Accountants can insert customers" ON customers;
CREATE POLICY "Accountants can insert customers"
  ON customers FOR INSERT
  WITH CHECK (public.user_has_company_role(company_id, 'accountant'));

DROP POLICY IF EXISTS "Accountants can update customers" ON customers;
CREATE POLICY "Accountants can update customers"
  ON customers FOR UPDATE
  USING (public.user_has_company_role(company_id, 'accountant'))
  WITH CHECK (public.user_has_company_role(company_id, 'accountant'));

-- ─── 7. RLS: approval snapshots (tenant read-only) ────────────────────────

ALTER TABLE document_approval_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view approval snapshots" ON document_approval_snapshots;
CREATE POLICY "Members can view approval snapshots"
  ON document_approval_snapshots FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    OR public.is_platform_admin()
    OR public.is_platform_support()
  );

-- Inserts/updates only via SECURITY DEFINER RPCs in later phases

-- ─── 8. RLS: approval tokens (no tenant direct access) ───────────────────

ALTER TABLE document_approval_tokens ENABLE ROW LEVEL SECURITY;

-- Intentionally no policies for authenticated — public approval APIs use service role / RPC

-- ─── 9. Sync lifecycle_status on document cancellation ─────────────────────

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
    lifecycle_status = 'cancelled',
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
    lifecycle_status = 'cancelled',
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
    lifecycle_status = 'cancelled',
    cancelled_at = NOW(),
    cancel_reason = trim(p_reason),
    cancelled_by = auth.uid()
  WHERE id = p_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice already cancelled' USING ERRCODE = '23505';
  END IF;
END;
$$;
