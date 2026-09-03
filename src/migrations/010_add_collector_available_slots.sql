-- PunahChakra Database Migration: 010_add_collector_available_slots.sql
-- Lets a collector mark which of the fixed 11:00 AM - 6:00 PM pickup slots they're
-- generally available for, shown/edited on CollectorProfileScreen.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS available_slots TEXT[] DEFAULT '{}';
