-- PunahChakra Migration: 022_add_collection_drives.sql
-- Admin-managed collection drives shown to donors. pincode is optional (NULL = citywide). Policies are open like the other admin-managed
-- tables (day_availability, serviceable_pincodes); the admin UI is the gate.

CREATE TABLE IF NOT EXISTS public.collection_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  drive_date date NOT NULL,
  time_window text,
  location text NOT NULL,
  pincode text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_drives ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Collection drives select" ON public.collection_drives FOR SELECT USING (true);
CREATE POLICY "Collection drives insert" ON public.collection_drives FOR INSERT WITH CHECK (true);
CREATE POLICY "Collection drives update" ON public.collection_drives FOR UPDATE USING (true);
CREATE POLICY "Collection drives delete" ON public.collection_drives FOR DELETE USING (true);
