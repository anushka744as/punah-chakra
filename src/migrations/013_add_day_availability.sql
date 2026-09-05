-- PunahChakra Database Migration: 013_add_day_availability.sql
-- Lets an admin manage pickup slot availability per specific calendar date (rather
-- than the flat, date-less `profiles.available_slots`), and mark a whole day closed.
-- No row for a date = fully open (fail-open), same default as the old flat list.

CREATE TABLE IF NOT EXISTS public.day_availability (
  day date PRIMARY KEY,
  available_slots text[] NOT NULL DEFAULT '{}',
  is_closed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.day_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Day availability select" ON public.day_availability FOR SELECT USING (true);
CREATE POLICY "Day availability insert" ON public.day_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Day availability update" ON public.day_availability FOR UPDATE USING (true);
