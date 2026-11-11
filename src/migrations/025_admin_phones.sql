-- PunahChakra Migration: 025_admin_phones.sql
-- Phone numbers that should always be admins. handle_new_user() checks this list when a phone
-- signs up for the first time, so that number lands in the admin panel straight after OTP login.
-- Numbers are stored as digits only, with country code (e.g. 919811275670). RLS is on with no
-- policies, so the app/client can never read or change this list; edit it from the SQL editor.

CREATE TABLE IF NOT EXISTS public.admin_phones (
  phone text PRIMARY KEY,
  note text
);
ALTER TABLE public.admin_phones ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_phones (phone, note) VALUES
  ('919811275670', 'original admin'),
  ('918447026757', 'added 2026-11-11')
ON CONFLICT (phone) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), NEW.phone, 'User'),
    COALESCE(NEW.phone, ''),
    CASE
      WHEN EXISTS (SELECT 1 FROM public.admin_phones a WHERE a.phone = regexp_replace(COALESCE(NEW.phone, ''), '\D', '', 'g'))
        THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- If a listed number already has a profile, promote it now.
UPDATE public.profiles p SET role = 'admin'
WHERE regexp_replace(COALESCE(p.phone, ''), '\D', '', 'g') IN (SELECT phone FROM public.admin_phones)
  AND p.role <> 'admin';
