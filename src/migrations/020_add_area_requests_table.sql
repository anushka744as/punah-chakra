-- PunahChakra Migration: 020_add_area_requests_table.sql
-- Waitlist for people whose pincode is not in serviceable_pincodes. Captures who asked, the
-- pincode, and (optionally) their GPS location so admins can see where demand is before
-- expanding service. One row per user + pincode (re-requesting just refreshes the row).

CREATE TABLE IF NOT EXISTS public.area_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  pincode text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pincode)
);

ALTER TABLE public.area_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Area requests insert own" ON public.area_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Area requests update own" ON public.area_requests
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Area requests select own or admin" ON public.area_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
