-- PunahChakra Migration: 015_remove_reward_points_system.sql
-- Removes the reward points / EcoPoints / CO2 offset tracking system entirely.

-- 1. Drop the category_points reward configuration table (and its RLS policies with it)
DROP TABLE IF EXISTS public.category_points;

-- 2. Drop the now-unused RLS policy that only existed to let collectors credit a
-- donor's points/co2_offset_kg profile fields on pickup completion (see migration 011)
DROP POLICY IF EXISTS "Collectors credit donor profile on completion" ON public.profiles;

-- 3. Drop the points & co2_offset_kg columns from profiles and donations
ALTER TABLE public.profiles DROP COLUMN IF EXISTS points;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS co2_offset_kg;
ALTER TABLE public.donations DROP COLUMN IF EXISTS points_awarded;
