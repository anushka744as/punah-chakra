-- PunahChakra Migration: 023_add_app_settings.sql
-- Small admin-editable key/value settings. Key 'time_slots' holds the pickup time slots shown to
-- donors as a JSON array of "H:MM AM/PM" labels. No row = the built-in 11:00 AM – 5:00 PM list.
-- Open policies like the other admin-managed tables; the admin UI is the gate.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App settings select" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "App settings insert" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "App settings update" ON public.app_settings FOR UPDATE USING (true);
