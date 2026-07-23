-- PunahChakra Migration: 002_category_points_rewards.sql
-- Table & Policies for Category-based Reward Points Configuration

-- 1. Create Category Points Table
CREATE TABLE IF NOT EXISTS public.category_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT UNIQUE NOT NULL,
  base_points INTEGER NOT NULL DEFAULT 100,
  points_per_kg INTEGER NOT NULL DEFAULT 50,
  co2_factor_per_kg NUMERIC(6, 2) NOT NULL DEFAULT 1.5,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.category_points ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow anyone (authenticated and anon users) to read reward points rules
CREATE POLICY "Allow public read access on category_points"
  ON public.category_points FOR SELECT
  USING (true);

-- Allow authenticated users/admins to insert/update points configuration
CREATE POLICY "Allow authenticated users to insert category_points"
  ON public.category_points FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update category_points"
  ON public.category_points FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 4. Seed Reward Points Configuration
INSERT INTO public.category_points (category, base_points, points_per_kg, co2_factor_per_kg, description)
VALUES
  ('CLOTHES', 300, 60, 2.5, 'Textiles & garments re-spinning and reuse'),
  ('E-WASTE', 500, 120, 4.0, 'Electronic scrap, cables & circuit components recovery'),
  ('PAPER', 150, 40, 1.2, 'Cardboard, newspapers & shredded paper pulping'),
  ('SHOES', 250, 50, 2.0, 'Footwear refurbishing and rubber recycling'),
  ('OTHERS', 100, 30, 1.0, 'General household recyclables')
ON CONFLICT (category) DO UPDATE SET
  base_points = EXCLUDED.base_points,
  points_per_kg = EXCLUDED.points_per_kg,
  co2_factor_per_kg = EXCLUDED.co2_factor_per_kg,
  description = EXCLUDED.description;
