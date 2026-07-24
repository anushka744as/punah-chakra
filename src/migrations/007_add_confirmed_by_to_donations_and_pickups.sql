-- PunahChakra Database Migration: 007_add_confirmed_by_to_donations_and_pickups.sql
-- Adds confirmed_by, collector_id, and confirmed_at columns to donations and pickups tables in Supabase.

-- 1. Add confirmed_by column to donations table if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Add collector_id column to donations table if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Add confirmed_at column to donations table if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 4. Add confirmed_by column to pickups table if not exists
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Add index for fast user lookup on confirmed pickups
CREATE INDEX IF NOT EXISTS idx_donations_confirmed_by ON public.donations(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_donations_collector_id ON public.donations(collector_id);
CREATE INDEX IF NOT EXISTS idx_pickups_confirmed_by ON public.pickups(confirmed_by);
