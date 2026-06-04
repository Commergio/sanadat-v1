-- Sanadat P1.9.1: Team management data layer
-- Scope: invitations lifecycle, secure member management RPCs, RLS hardening.

-- ---------------------------------------------------------------------------
-- 1) company_invitations lifecycle columns
-- ---------------------------------------------------------------------------
ALTER TABLE company_invitations
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES profiles(id);

-- ---------------------------------------------------------------------------
-- 2) Indexes
-- ---------------------------------------------------------------------------
-- Active invitation lookup by company + email (normalized lower(email)).
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_email_active
  ON company_invitations (company_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- Role-based member lookup per company.
CREATE INDEX IF NOT EXISTS idx_company_members_company_role
  ON company_members (company_id, role);

-- ---------------------------------------------------------------------------
-- 3) Partial uniqueness: one active invitation per (company_id, email)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_invitations_active_company_email
  ON company_invitations (company_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- 4) Secure RPC contracts
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.invite_company_member(
  p_company_id UUID,
  p_email TEXT,
  p_role tenant_role DEFAULT 'accountant',
  p_expires_in_hours INTEGER DEFAULT 72
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_existing_invitation_id UUID;
  v_existing_member_id UUID;
  v_token TEXT;
  v_invitation_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.user_has_company_role(p_company_id, 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  v_email := lower(trim(COALESCE(p_email, '')));
  IF v_email = '' THEN
    RAISE EXCEPTION 'Validation: email is required' USING ERRCODE = '22023';
  END IF;

  IF p_role = 'owner' THEN
    RAISE EXCEPTION 'Validation: owner role cannot be invited' USING ERRCODE = '22023';
  END IF;

  IF p_expires_in_hours < 1 OR p_expires_in_hours > 720 THEN
    RAISE EXCEPTION 'Validation: expires window must be between 1 and 720 hours' USING ERRCODE = '22023';
  END IF;

  SELECT cm.id INTO v_existing_member_id
  FROM company_members cm
  JOIN profiles p ON p.id = cm.user_id
  WHERE cm.company_id = p_company_id
    AND lower(p.email) = v_email
  LIMIT 1;

  IF v_existing_member_id IS NOT NULL THEN
    RAISE EXCEPTION 'Conflict: user is already a company member' USING ERRCODE = '23505';
  END IF;

  SELECT id INTO v_existing_invitation_id
  FROM company_invitations
  WHERE company_id = p_company_id
    AND lower(email) = v_email
    AND accepted_at IS NULL
    AND revoked_at IS NULL
  LIMIT 1;

  v_token := replace(uuid_generate_v4()::text || uuid_generate_v4()::text, '-', '');

  IF v_existing_invitation_id IS NOT NULL THEN
    UPDATE company_invitations
    SET
      role = p_role,
      token = v_token,
      invited_by = auth.uid(),
      expires_at = NOW() + make_interval(hours => p_expires_in_hours),
      revoked_at = NULL,
      revoked_by = NULL
    WHERE id = v_existing_invitation_id
    RETURNING id INTO v_invitation_id;
  ELSE
    INSERT INTO company_invitations (
      company_id,
      email,
      role,
      token,
      invited_by,
      expires_at
    )
    VALUES (
      p_company_id,
      v_email,
      p_role,
      v_token,
      auth.uid(),
      NOW() + make_interval(hours => p_expires_in_hours)
    )
    RETURNING id INTO v_invitation_id;
  END IF;

  RETURN v_invitation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_company_invitation(
  p_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_invitation RECORD;
  v_existing_member_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_user_email := lower(trim(COALESCE(auth.jwt()->>'email', '')));
  IF v_user_email = '' THEN
    RAISE EXCEPTION 'Validation: authenticated email is required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_invitation
  FROM company_invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND revoked_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_invitation.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Invitation expired' USING ERRCODE = '22023';
  END IF;

  IF lower(v_invitation.email) <> v_user_email THEN
    RAISE EXCEPTION 'Invitation email mismatch' USING ERRCODE = '42501';
  END IF;

  IF v_invitation.role = 'owner' THEN
    RAISE EXCEPTION 'Validation: owner role cannot be accepted via invitation' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_existing_member_id
  FROM company_members
  WHERE company_id = v_invitation.company_id
    AND user_id = v_user_id
  LIMIT 1;

  IF v_existing_member_id IS NULL THEN
    INSERT INTO company_members (
      company_id,
      user_id,
      role,
      invited_by,
      invited_at,
      accepted_at
    )
    VALUES (
      v_invitation.company_id,
      v_user_id,
      v_invitation.role,
      v_invitation.invited_by,
      v_invitation.created_at,
      NOW()
    );
  END IF;

  UPDATE company_invitations
  SET accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN v_invitation.company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_company_member_role(
  p_member_id UUID,
  p_new_role tenant_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_owner_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_member
  FROM company_members
  WHERE id = p_member_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_member.company_id, 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_new_role = 'owner' THEN
    RAISE EXCEPTION 'Validation: owner role cannot be assigned via this function' USING ERRCODE = '22023';
  END IF;

  IF v_member.role = 'owner' AND p_new_role <> 'owner' THEN
    SELECT COUNT(*) INTO v_owner_count
    FROM company_members
    WHERE company_id = v_member.company_id
      AND role = 'owner';

    IF v_owner_count <= 1 THEN
      RAISE EXCEPTION 'Conflict: no orphan-owner state allowed' USING ERRCODE = '23505';
    END IF;
  END IF;

  UPDATE company_members
  SET role = p_new_role
  WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_company_member(
  p_member_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_owner_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_member
  FROM company_members
  WHERE id = p_member_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_member.company_id, 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_member.role = 'owner' THEN
    RAISE EXCEPTION 'Validation: owner cannot be removed' USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*) INTO v_owner_count
  FROM company_members
  WHERE company_id = v_member.company_id
    AND role = 'owner';

  IF v_owner_count <= 0 THEN
    RAISE EXCEPTION 'Conflict: no orphan-owner state allowed' USING ERRCODE = '23505';
  END IF;

  DELETE FROM company_members
  WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_company_invitation(
  p_invitation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_invitation
  FROM company_invitations
  WHERE id = p_invitation_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.user_has_company_role(v_invitation.company_id, 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_invitation.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Conflict: accepted invitation cannot be revoked' USING ERRCODE = '23505';
  END IF;

  UPDATE company_invitations
  SET
    revoked_at = NOW(),
    revoked_by = auth.uid()
  WHERE id = p_invitation_id
    AND revoked_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_company_member(UUID, TEXT, tenant_role, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_company_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_company_member_role(UUID, tenant_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_company_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_company_invitation(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) RLS hardening
-- ---------------------------------------------------------------------------
-- Invitations: explicit lifecycle-safe policies (admins only manage records).
DROP POLICY IF EXISTS "Admins can view invitations" ON company_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON company_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON company_invitations;

CREATE POLICY "Admins can view invitations"
  ON company_invitations FOR SELECT
  USING (public.user_has_company_role(company_id, 'admin'));

CREATE POLICY "Admins can create invitations"
  ON company_invitations FOR INSERT
  WITH CHECK (
    public.user_has_company_role(company_id, 'admin')
    AND role <> 'owner'
  );

CREATE POLICY "Admins can update invitations"
  ON company_invitations FOR UPDATE
  USING (public.user_has_company_role(company_id, 'admin'))
  WITH CHECK (
    public.user_has_company_role(company_id, 'admin')
    AND role <> 'owner'
  );

CREATE POLICY "Admins can delete invitations"
  ON company_invitations FOR DELETE
  USING (public.user_has_company_role(company_id, 'admin'));

-- Members: block direct UPDATE/DELETE for stronger invariants; enforce RPC path.
DROP POLICY IF EXISTS "Admins can update memberships" ON company_members;
DROP POLICY IF EXISTS "Admins can delete memberships" ON company_members;

CREATE POLICY "No direct membership updates"
  ON company_members FOR UPDATE
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "No direct membership deletes"
  ON company_members FOR DELETE
  USING (FALSE);
