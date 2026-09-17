-- PunahChakra Migration: 017_add_pincode_to_day_availability.sql
-- Pickup slot availability becomes per-pincode instead of one global calendar: an admin
-- can now open/close slots independently for each serviceable pincode on the same date.

ALTER TABLE public.day_availability ADD COLUMN IF NOT EXISTS pincode text NOT NULL DEFAULT '';

ALTER TABLE public.day_availability DROP CONSTRAINT IF EXISTS day_availability_pkey;
ALTER TABLE public.day_availability ADD PRIMARY KEY (pincode, day);
