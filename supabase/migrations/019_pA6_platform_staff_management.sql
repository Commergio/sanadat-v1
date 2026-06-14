-- P A.6: Platform staff management (assign / change / remove platform_role)
-- Review: platform_role enum exists (004): platform_admin | platform_support
-- profiles.platform_role is NULL for normal tenant users.

CREATE INDEX IF NOT EXISTS idx_profiles_platform_role
  ON profiles (platform_role)
  WHERE platform_role IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RPC: platform_add_staff
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.platform_add_staff(
  p_email TEXT,
  p_platform_role platform_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_profile profiles%ROWTYPE;
  v_normalized_email TEXT := lower(trim(p_email));
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_admin required' USING ERRCODE = '42501';
  END IF;

  IF v_normalized_email IS NULL OR v_normalized_email = '' THEN
    RAISE EXCEPTION 'VALIDATION: email is required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_profile
  FROM profiles
  WHERE lower(email) = v_normalized_email
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDATION: User must register first before being assigned as platform staff.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_profile.platform_role IS NOT NULL THEN
    RAISE EXCEPTION 'VALIDATION: User is already platform staff' USING ERRCODE = '22023';
  END IF;

  UPDATE profiles
  SET platform_role = p_platform_role, updated_at = NOW()
  WHERE id = v_profile.id;

  INSERT INTO platform_admin_actions (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin_id,
    'platform_staff.added',
    'platform_staff',
    v_profile.id,
    jsonb_build_object(
      'target_profile_id', v_profile.id,
      'target_email', v_profile.email,
      'old_role', NULL,
      'new_role', p_platform_role::text,
      'actor_admin_id', v_admin_id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'profile_id', v_profile.id,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'platform_role', p_platform_role::text,
    'created_at', v_profile.created_at
  );
END;
$$;

COMMENT ON FUNCTION public.platform_add_staff IS
  'Assign platform_role to an existing registered user (platform_admin only)';

-- ---------------------------------------------------------------------------
-- RPC: platform_change_staff_role
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.platform_change_staff_role(
  p_profile_id UUID,
  p_platform_role platform_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_profile profiles%ROWTYPE;
  v_admin_count BIGINT;
  v_old_role platform_role;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_admin required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_profile.platform_role IS NULL THEN
    RAISE EXCEPTION 'VALIDATION: User is not platform staff' USING ERRCODE = '22023';
  END IF;

  v_old_role := v_profile.platform_role;

  IF v_old_role = p_platform_role THEN
    RAISE EXCEPTION 'VALIDATION: Role is unchanged' USING ERRCODE = '22023';
  END IF;

  IF v_old_role = 'platform_admin'::platform_role
     AND p_platform_role <> 'platform_admin'::platform_role THEN
    SELECT COUNT(*)::bigint INTO v_admin_count
    FROM profiles
    WHERE platform_role = 'platform_admin'::platform_role;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'CONFLICT: Cannot remove the last platform admin' USING ERRCODE = '23505';
    END IF;
  END IF;

  UPDATE profiles
  SET platform_role = p_platform_role, updated_at = NOW()
  WHERE id = p_profile_id;

  INSERT INTO platform_admin_actions (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin_id,
    'platform_staff.role_changed',
    'platform_staff',
    p_profile_id,
    jsonb_build_object(
      'target_profile_id', p_profile_id,
      'target_email', v_profile.email,
      'old_role', v_old_role::text,
      'new_role', p_platform_role::text,
      'actor_admin_id', v_admin_id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'profile_id', p_profile_id,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'platform_role', p_platform_role::text,
    'created_at', v_profile.created_at
  );
END;
$$;

COMMENT ON FUNCTION public.platform_change_staff_role IS
  'Change platform_role for existing staff (platform_admin only; protects last admin)';

-- ---------------------------------------------------------------------------
-- RPC: platform_remove_staff
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.platform_remove_staff(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_profile profiles%ROWTYPE;
  v_admin_count BIGINT;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_admin required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_profile.platform_role IS NULL THEN
    RAISE EXCEPTION 'VALIDATION: User is not platform staff' USING ERRCODE = '22023';
  END IF;

  IF v_profile.platform_role = 'platform_admin'::platform_role THEN
    SELECT COUNT(*)::bigint INTO v_admin_count
    FROM profiles
    WHERE platform_role = 'platform_admin'::platform_role;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'CONFLICT: Cannot remove the last platform admin' USING ERRCODE = '23505';
    END IF;
  END IF;

  UPDATE profiles
  SET platform_role = NULL, updated_at = NOW()
  WHERE id = p_profile_id;

  INSERT INTO platform_admin_actions (admin_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin_id,
    'platform_staff.removed',
    'platform_staff',
    p_profile_id,
    jsonb_build_object(
      'target_profile_id', p_profile_id,
      'target_email', v_profile.email,
      'old_role', v_profile.platform_role::text,
      'new_role', NULL,
      'actor_admin_id', v_admin_id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'profile_id', p_profile_id
  );
END;
$$;

COMMENT ON FUNCTION public.platform_remove_staff IS
  'Remove platform_role from staff (platform_admin only; protects last admin)';

GRANT EXECUTE ON FUNCTION public.platform_add_staff(TEXT, platform_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_change_staff_role(UUID, platform_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_remove_staff(UUID) TO authenticated;
