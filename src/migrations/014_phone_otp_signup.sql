-- Phone number + OTP signup support.
--
-- Phone-based signups create an auth.users row with a phone but no email, and the
-- handle_new_user trigger (from 001/012) inserts NEW.email straight into profiles.email,
-- which is NOT NULL — that insert would fail and the whole signup would break before the
-- app code ever runs. Backfill from NEW.phone in that case instead of relaxing the
-- NOT NULL constraint, and also persist NEW.phone onto the new profiles.phone column.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), NEW.phone, 'User'),
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
