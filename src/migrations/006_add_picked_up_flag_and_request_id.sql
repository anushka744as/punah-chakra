-- PunahChakra Database Migration: 006_add_picked_up_flag_and_request_id.sql
-- Adds is_picked_up boolean column and request_id column to donations table in Supabase.

-- 1. Add is_picked_up column if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS is_picked_up BOOLEAN DEFAULT FALSE;

-- 2. Add request_id column if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS request_id TEXT;

-- 3. Add picked_up_at column if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;

-- 4. Update existing donations to have request_id if null
UPDATE public.donations
SET request_id = '#PC-' || UPPER(SUBSTRING(id::text, 1, 5))
WHERE request_id IS NULL;
