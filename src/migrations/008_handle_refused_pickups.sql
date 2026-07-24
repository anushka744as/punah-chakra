-- PunahChakra Database Migration: 008_handle_refused_pickups.sql
-- Adds refused_by and refused_at columns to donations and pickups tables to handle refused pickups re-opening for all collectors.

-- 1. Add refused_by column to donations table if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS refused_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Add refused_at column to donations table if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS refused_at TIMESTAMPTZ;

-- 3. Add refused_by column to pickups table if not exists
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS refused_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Add index for refused pickups lookup
CREATE INDEX IF NOT EXISTS idx_donations_refused_by ON public.donations(refused_by);
CREATE INDEX IF NOT EXISTS idx_pickups_refused_by ON public.pickups(refused_by);
