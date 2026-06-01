-- Sanadat P0: Signup trigger — profile, company (owner_id), company_members, trial subscription

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
BEGIN
  company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'منشأتي'
  );

  INSERT INTO public.profiles (id, email, phone, full_name, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    company_name,
    FALSE
  );

  INSERT INTO public.companies (
    user_id,
    owner_id,
    name,
    phone,
    email,
    profile_completed
  )
  VALUES (
    NEW.id,
    NEW.id,
    company_name,
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    30
  )
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (company_id, user_id, role, accepted_at)
  VALUES (new_company_id, NEW.id, 'owner', NOW());

  INSERT INTO public.subscriptions (
    company_id,
    status,
    amount,
    expires_at,
    auto_renew
  )
  VALUES (
    new_company_id,
    'trialing',
    399.00,
    NOW() + INTERVAL '14 days',
    FALSE
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
