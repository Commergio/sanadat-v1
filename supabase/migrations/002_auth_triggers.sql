-- Auto-create profile + company + trial subscription on signup

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

  INSERT INTO public.companies (user_id, name, phone, email, profile_completed)
  VALUES (
    NEW.id,
    company_name,
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    30
  )
  RETURNING id INTO new_company_id;

  INSERT INTO public.subscriptions (
    company_id,
    status,
    amount,
    expires_at,
    auto_renew
  )
  VALUES (
    new_company_id,
    'active',
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

-- Allow users to read their own profile (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;
