-- PunahChakra Migration: 026_add_device_tokens.sql
-- FCM push tokens, one row per phone/app install, so the send-push edge function can deliver
-- notifications while the app is closed. A user can have several devices. Rows cascade away when
-- the account is deleted. Users manage only their own tokens; the edge function reads them with
-- the service role.

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'android',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON public.device_tokens (user_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Device tokens select own" ON public.device_tokens;
DROP POLICY IF EXISTS "Device tokens insert own" ON public.device_tokens;
DROP POLICY IF EXISTS "Device tokens update own" ON public.device_tokens;
DROP POLICY IF EXISTS "Device tokens delete own" ON public.device_tokens;
CREATE POLICY "Device tokens select own" ON public.device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Device tokens insert own" ON public.device_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Device tokens update own" ON public.device_tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Device tokens delete own" ON public.device_tokens FOR DELETE USING (auth.uid() = user_id);
