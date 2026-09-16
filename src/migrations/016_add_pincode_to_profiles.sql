-- PunahChakra Migration: 016_add_pincode_to_profiles.sql
-- Adds a pincode column so a signup's service-area pincode (validated client-side
-- against the Delhi/Noida serviceable range) is persisted on the profile.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '';
