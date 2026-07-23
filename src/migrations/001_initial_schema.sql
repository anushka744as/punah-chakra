-- PunahChakra Core Database Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('donor', 'collector', 'recycler')),
  points INTEGER DEFAULT 0,
  co2_offset_kg NUMERIC(10, 2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  weight_kg NUMERIC(10, 2) DEFAULT 0.0,
  pickup_day TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  instructions TEXT DEFAULT '',
  address TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'assigned', 'collected', 'assessed', 'completed', 'cancelled')),
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Pickups Table
CREATE TABLE IF NOT EXISTS public.pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_phone TEXT DEFAULT '',
  address TEXT NOT NULL,
  zone TEXT DEFAULT 'Noida Sector 15A & 44',
  latitude NUMERIC(10, 6) DEFAULT 28.5833,
  longitude NUMERIC(10, 6) DEFAULT 77.3167,
  weight_summary TEXT DEFAULT '12.4 kg',
  time_window TEXT DEFAULT '09:00 AM - 12:00 PM',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'collected', 'assessed', 'completed')),
  scheduled_date TEXT DEFAULT 'Today',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Quality Inspections Table
CREATE TABLE IF NOT EXISTS public.quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID REFERENCES public.pickups(id) ON DELETE SET NULL,
  inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  batch_identifier TEXT NOT NULL,
  weight_kg NUMERIC(10, 2) DEFAULT 0.0,
  origin TEXT DEFAULT 'Sector 15A',
  check_cleanliness BOOLEAN DEFAULT true,
  check_sorting BOOLEAN DEFAULT true,
  check_contamination BOOLEAN DEFAULT true,
  notes TEXT DEFAULT '',
  decision TEXT DEFAULT 'ACCEPTED' CHECK (decision IN ('ACCEPTED', 'REJECTED', 'PENDING')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag TEXT DEFAULT 'PICKUP REMINDER',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  time_ago TEXT DEFAULT 'Just now',
  badge TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_pickups_collector_id ON public.pickups(collector_id);
CREATE INDEX IF NOT EXISTS idx_pickups_status ON public.pickups(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles Policy
CREATE POLICY "Public profiles reading" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Donations Policy
CREATE POLICY "Donors select own donations" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Donors insert donations" ON public.donations FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors/Collectors update donations" ON public.donations FOR UPDATE USING (true);

-- Pickups Policy
CREATE POLICY "Select pickups" ON public.pickups FOR SELECT USING (true);
CREATE POLICY "Insert pickups" ON public.pickups FOR INSERT WITH CHECK (true);
CREATE POLICY "Update pickups" ON public.pickups FOR UPDATE USING (true);

-- Quality Inspections Policy
CREATE POLICY "Quality inspections select" ON public.quality_inspections FOR SELECT USING (true);
CREATE POLICY "Quality inspections insert" ON public.quality_inspections FOR INSERT WITH CHECK (true);

-- Notifications Policy
CREATE POLICY "User notifications select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User notifications update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
