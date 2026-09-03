-- PunahChakra Migration: 012_rename_roles_to_user_admin.sql
-- Simplifies the role model from donor/collector/recycler down to user/admin.

-- 1. Drop the old check constraint first so the interim UPDATEs below aren't
-- rejected by it before the new role values are in place.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Migrate existing profile rows to the new role values.
UPDATE public.profiles SET role = 'user' WHERE role = 'donor';
UPDATE public.profiles SET role = 'admin' WHERE role IN ('collector', 'recycler');

-- 3. Add the new check constraint restricted to the new role values.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- 4. Update the new-user trigger to default to 'user' instead of 'donor'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
