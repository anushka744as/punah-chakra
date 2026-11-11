-- PunahChakra Migration: 024_add_drop_off_points.sql
-- Admin-managed drop-off points shown to donors on the Drives page. Each point is open between
-- start_date and end_date (inclusive), with daily opening hours. pincode is optional (NULL = citywide).
-- is_active lets the admin pause a point without deleting it. Open policies like the other
-- admin-managed tables (collection_drives); the admin UI is the gate.

CREATE TABLE IF NOT EXISTS public.drop_off_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  pincode text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  open_time text,
  close_time text,
  contact text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

ALTER TABLE public.drop_off_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drop-off points select" ON public.drop_off_points;
CREATE POLICY "Drop-off points select" ON public.drop_off_points FOR SELECT USING (true);
DROP POLICY IF EXISTS "Drop-off points insert" ON public.drop_off_points;
CREATE POLICY "Drop-off points insert" ON public.drop_off_points FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Drop-off points update" ON public.drop_off_points;
CREATE POLICY "Drop-off points update" ON public.drop_off_points FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Drop-off points delete" ON public.drop_off_points;
CREATE POLICY "Drop-off points delete" ON public.drop_off_points FOR DELETE USING (true);
