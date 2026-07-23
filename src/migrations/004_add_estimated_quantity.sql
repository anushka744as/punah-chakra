-- PunahChakra Database Migration: 004_add_estimated_quantity.sql
-- Adds an explicit estimated_quantity_kg column to the donations table.

ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS estimated_quantity_kg NUMERIC(10, 2) DEFAULT 0.0;

-- Sync existing data from weight_kg to the new column
UPDATE public.donations 
SET estimated_quantity_kg = weight_kg 
WHERE estimated_quantity_kg = 0.0;
