-- PunahChakra Migration: 018_add_serviceable_pincodes_table.sql
-- Serviceable pincodes move from a hardcoded client-side list into the database, so an
-- admin can add/remove them at runtime and every user (pincode checks, the calendar's
-- pincode dropdown) sees the change immediately without an app update.

CREATE TABLE IF NOT EXISTS public.serviceable_pincodes (
  pincode text PRIMARY KEY CHECK (pincode ~ '^[0-9]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.serviceable_pincodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Serviceable pincodes select" ON public.serviceable_pincodes FOR SELECT USING (true);
CREATE POLICY "Serviceable pincodes insert" ON public.serviceable_pincodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Serviceable pincodes delete" ON public.serviceable_pincodes FOR DELETE USING (true);

-- Seed with the pincodes the app already served out of the old hardcoded list.
INSERT INTO public.serviceable_pincodes (pincode) VALUES
  ('201301'),
  ('201303'),
  ('110091'),
  ('110092'),
  ('110096')
ON CONFLICT (pincode) DO NOTHING;
