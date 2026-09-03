-- The existing "Users update own profile" policy (auth.uid() = id) silently blocks
-- QualityScreen.handleAcceptBatch's donor-crediting update: the collector accepting a
-- batch is a different authenticated user than the donor whose profiles row is being
-- credited, so the UPDATE matches zero rows (no error — RLS just filters the row out).
-- Net effect: donors never actually receive points/CO2 credit on pickup completion.
--
-- Adds a second permissive UPDATE policy on profiles, matching the already-open
-- USING (true) pattern used for donations/pickups elsewhere in this schema, so any
-- authenticated user (in practice: the collector completing a pickup) can update it.
CREATE POLICY "Collectors credit donor profile on completion" ON public.profiles
  FOR UPDATE USING (true);
