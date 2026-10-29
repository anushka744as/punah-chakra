-- PunahChakra Migration: 021_add_slot_capacity.sql
-- Seats per time slot: how many donors can book the same slot for a given pincode + day.
-- NULL means "use the app default" (DEFAULT_SLOT_CAPACITY, currently 5), so existing rows and
-- days with no row keep working. Set by the admin in the availability calendar.

ALTER TABLE public.day_availability
  ADD COLUMN IF NOT EXISTS slot_capacity integer
  CHECK (slot_capacity IS NULL OR (slot_capacity BETWEEN 1 AND 100));

-- Every pincode/day starts with 5 seats per slot.
ALTER TABLE public.day_availability ALTER COLUMN slot_capacity SET DEFAULT 5;
UPDATE public.day_availability SET slot_capacity = 5 WHERE slot_capacity IS NULL;
