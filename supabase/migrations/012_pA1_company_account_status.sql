-- P A.1: Company account status (platform operational suspend, separate from subscription billing)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_account_status') THEN
    CREATE TYPE company_account_status AS ENUM ('active', 'suspended');
  END IF;
END $$;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS account_status company_account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

COMMENT ON COLUMN companies.account_status IS 'Platform operational status; suspended blocks tenant app access (enforced in app layer)';
COMMENT ON COLUMN companies.suspended_at IS 'When the company was suspended by platform staff';
COMMENT ON COLUMN companies.suspended_by IS 'Platform profile that suspended the company';
COMMENT ON COLUMN companies.suspension_reason IS 'Optional internal reason for suspension';

CREATE INDEX IF NOT EXISTS idx_companies_account_status
  ON companies (account_status)
  WHERE account_status = 'suspended';
