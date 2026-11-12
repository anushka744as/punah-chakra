-- PunahChakra Migration: 027_protect_profile_role.sql
-- The "Users update own profile" policy lets a signed-in user update their own row, which included
-- the `role` column, so a donor could promote themselves to admin through the API. This trigger
-- blocks any change to `role` coming from an app request (auth.uid() is set). The SQL editor and
-- the service role have no auth.uid(), so admins can still be promoted from there (and the
-- admin_phones migration keeps working).

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();
