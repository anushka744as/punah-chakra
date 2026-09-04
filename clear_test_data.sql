-- Clears transactional/test data from PunahChakra while keeping user
-- accounts, profiles, and reward config (category_points) intact.
-- Run in Supabase Dashboard -> SQL Editor. Review row counts first.

-- 1. See what you're about to delete
select 'donations' as table_name, count(*) from donations
union all
select 'pickups', count(*) from pickups
union all
select 'notifications', count(*) from notifications;

-- 2. Delete, in FK-safe order (pickups/notifications reference donations)
delete from pickups;
delete from notifications;
delete from donations;

-- 3. Optional: reset accumulated points/CO2 offset on profiles back to zero
-- (these were built up from the test donations you just deleted)
-- update profiles set points = 0, co2_offset_kg = 0.0;
