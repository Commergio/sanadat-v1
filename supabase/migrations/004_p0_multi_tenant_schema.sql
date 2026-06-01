-- Sanadat P0: Multi-tenant schema (company_members, tenant roles, platform roles)
-- Requires migrations 001–003. Does not add document registry or payment changes.

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE platform_role AS ENUM ('platform_admin', 'platform_support');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'accountant', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';

-- ─── Profiles: platform role (separate from legacy profiles.role) ────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS platform_role platform_role;

UPDATE profiles
SET platform_role = 'platform_admin'::platform_role
WHERE role = 'admin'::user_role AND platform_role IS NULL;

-- ─── Companies: owner + extended profile fields ──────────────────────────────

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT,
  ADD COLUMN IF NOT EXISTS signature_url TEXT;

UPDATE companies
SET owner_id = user_id
WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- ─── Company members (tenant membership) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'owner',
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_members_user_company
  ON company_members (user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company
  ON company_members (company_id);

INSERT INTO company_members (company_id, user_id, role, accepted_at)
SELECT c.id, c.user_id, 'owner'::tenant_role, c.created_at
FROM companies c
WHERE c.user_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;

-- ─── Company invitations (schema only; invite flow in later phase) ───────────

CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role tenant_role NOT NULL DEFAULT 'accountant',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, email)
);

CREATE INDEX IF NOT EXISTS idx_company_invitations_token
  ON company_invitations (token);

-- ─── Triggers: updated_at on new tables ──────────────────────────────────────

DROP TRIGGER IF EXISTS company_members_updated_at ON company_members;
CREATE TRIGGER company_members_updated_at
  BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS enable ──────────────────────────────────────────────────────────────

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
