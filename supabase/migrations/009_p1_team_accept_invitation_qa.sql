-- P1.9 QA: clearer accept invitation errors (expired / already accepted / revoked)

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
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_invitation.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation already accepted' USING ERRCODE = '23505';
  END IF;

  IF v_invitation.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation revoked' USING ERRCODE = '22023';
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
