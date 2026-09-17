-- PunahChakra Migration: 019_add_pincode_to_donations.sql
-- Captures the pincode a donation pickup was booked under (already verified against
-- serviceable_pincodes at booking time in DonateScreen) so the admin map can filter
-- pickups/orders by area.

ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS pincode text DEFAULT '';
