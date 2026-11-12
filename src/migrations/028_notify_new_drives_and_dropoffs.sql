-- PunahChakra Migration: 028_notify_new_drives_and_dropoffs.sql
-- When an admin adds a collection drive or a drop-off point, every donor it applies to gets an
-- alert in the `notifications` table (shown on the Alerts screen; also pushed to phones once the
-- send-push webhook is connected to this table). A drive/drop-off with a pincode only alerts donors
-- in that pincode; with no pincode it alerts all donors. Admins are not alerted. Only INSERTs
-- notify, so editing a drive or pausing a drop-off point never re-sends. Paused (inactive)
-- drop-off points don't notify.

CREATE OR REPLACE FUNCTION public.notify_new_drive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, tag, title, body)
  SELECT p.id,
         'COLLECTION DRIVE',
         'New collection drive',
         NEW.title || ' on ' || to_char(NEW.drive_date, 'DD Mon') ||
           COALESCE(' (' || NULLIF(NEW.time_window, '') || ')', '') || ' at ' || NEW.location || '.'
  FROM public.profiles p
  WHERE p.role = 'user'
    AND (NEW.pincode IS NULL OR NEW.pincode = '' OR p.pincode = NEW.pincode);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_drop_off_point()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, tag, title, body)
  SELECT p.id,
         'DROP-OFF POINT',
         'New drop-off point',
         NEW.name || ', ' || NEW.address || ' is open ' || to_char(NEW.start_date, 'DD Mon') ||
           ' to ' || to_char(NEW.end_date, 'DD Mon') || '.'
  FROM public.profiles p
  WHERE p.role = 'user'
    AND (NEW.pincode IS NULL OR NEW.pincode = '' OR p.pincode = NEW.pincode);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_new_drive ON public.collection_drives;
CREATE TRIGGER notify_new_drive
  AFTER INSERT ON public.collection_drives
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_drive();

DROP TRIGGER IF EXISTS notify_new_drop_off_point ON public.drop_off_points;
CREATE TRIGGER notify_new_drop_off_point
  AFTER INSERT ON public.drop_off_points
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_drop_off_point();
