-- PunahChakra Migration: 003_notifications_schema.sql
-- Table and Policies for User Notifications & Alerts

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tag TEXT DEFAULT 'PICKUP',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Allow users to read their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'authenticated');
