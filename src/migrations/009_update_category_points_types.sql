-- PunahChakra Migration: 009_update_category_points_types.sql
-- Update donation categories to Clothes, Shoes, Blankets/Bedsheets, Bags

INSERT INTO public.category_points (category, base_points, points_per_kg, co2_factor_per_kg, description)
VALUES
  ('BLANKETS', 280, 55, 2.2, 'Blankets and bedsheets reuse and textile recycling'),
  ('BAGS', 200, 45, 1.8, 'Bags reuse and material recovery')
ON CONFLICT (category) DO UPDATE SET
  base_points = EXCLUDED.base_points,
  points_per_kg = EXCLUDED.points_per_kg,
  co2_factor_per_kg = EXCLUDED.co2_factor_per_kg,
  description = EXCLUDED.description;

DELETE FROM public.category_points WHERE category IN ('E-WASTE', 'PAPER');
