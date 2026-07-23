-- PunahChakra Database Migration: 005_fix_donations_status_check.sql
-- Removes strict status check constraint restriction on donations table to prevent status violation errors.

-- 1. Drop existing check constraint if present
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_status_check;

-- 2. Re-add expanded status check constraint incorporating 'in_transit', 'confirmed', and all active states
ALTER TABLE public.donations ADD CONSTRAINT donations_status_check CHECK (
  status IN (
    'pending',
    'scheduled',
    'assigned',
    'in_transit',
    'collected',
    'assessed',
    'completed',
    'cancelled',
    'confirmed'
  )
);
