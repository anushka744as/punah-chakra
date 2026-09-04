# Session notes — 2026-09-04

## 1. Theme colors matched to logo
- Sampled logo colors: green `#01A03A`, blue `#025798`.
- Updated `src/theme/theme.ts`: `primary` -> `#0E9E46` (green), `secondary` -> `#0A5FA0` (blue),
  plus matching container/dark variants and `clay`. Backgrounds/surfaces left unchanged.

## 2. Play Store release process (app already live)
- Live package: `com.vivaan.punahchakra` (matches current `android/app/build.gradle`).
- Version bumped: `versionCode 1 -> 2`, `versionName "1.0" -> "1.1"` in `android/app/build.gradle`.
- Release signing already configured via `MYAPP_UPLOAD_*` properties in `android/gradle.properties`.
- Build command: `cd android && ./gradlew bundleRelease`
- Output: `android/app/build/outputs/bundle/release/app-release.aab`
- To publish: Play Console -> Test and release -> Production -> Create new release -> upload
  the `.aab` -> add release notes -> Review -> Start rollout to Production. (Manual step — no
  Play Console API access from this session.)

## 3. Removed mock/dummy data from app code
- Deleted `PERMANENT_DONATIONS` hardcoded arrays from `src/screens/CollectorDashboardScreen.tsx`
  and `src/screens/QualityScreen.tsx` — these silently injected 6 fake pickups whenever the real
  Supabase donations list was empty.
- Replaced fabricated fallback values (fake IDs/weights/addresses) with `—` placeholders in
  `src/screens/ConfirmationScreen.tsx` and `src/screens/QualityScreen.tsx`.
- Replaced static hardcoded stats ("128.4 Tons", "98.6%") in `src/screens/RecyclerAnalyticsScreen.tsx`
  with `—` (screen is currently unused/not wired into navigation).
- **Remaining mock data lives in the live Supabase database itself** (test donations/pickups with
  addresses like "Sector 15A", "Migration Verify Address", "Collector Flow Test Address").
  A cleanup script was generated at `clear_test_data.sql` (project root) — run it in the
  Supabase Dashboard SQL Editor to wipe `donations`, `pickups`, `notifications` tables. Optional
  last line resets `profiles.points` / `profiles.co2_offset_kg` to 0 if you want a fully fresh
  leaderboard too.

## 4. Notification flow changes
- New pickup request now notifies **all** `profiles` with `role = 'admin'` (added in
  `createDonationRequest` in `src/services/api.ts`), titled "New Pickup Request".
- Donor "pickup accepted" notification already existed (sent from `CollectorDashboardScreen`'s
  confirm handler) — no change needed there.

## 5. Simplified the Quality/completion flow
- Removed the condition-checklist form and free-text notes field from `src/screens/QualityScreen.tsx`.
- Kept the two-step flow: **Confirm** (Routes tab — assigns the collector) then **Mark Picked Up**
  (Quality tab — completes the pickup and credits donor points/CO2; same as before, just no
  checklist UI in front of it).
- Renamed UI text for clarity: "Assess" button -> "Complete", "Quality Assessment" header ->
  "Complete Pickup", "ACCEPT" button -> "MARK PICKED UP".

## 6. Added Google Play in-app update prompt
- Installed `sp-react-native-in-app-updates` (wraps Google Play's In-App Update API).
- New hook: `src/hooks/useAppUpdateCheck.ts`, wired into `App.tsx` on startup (Android only).
- Configured as **Immediate** update: full-screen forced "Update required" prompt on app open
  when Play Store has a newer version than what's installed.
- **Important**: this can't retroactively prompt users for the version being published now — the
  check-for-update code has to already be installed on a user's device before Play can detect a
  *newer* version exists. So the prompt will start showing starting from the release *after* this
  one, for anyone who has this version (versionCode 2) installed.

## Open items / things to verify
- Run `clear_test_data.sql` against the live Supabase project to clear leftover test rows.
- Upload `app-release.aab` (versionCode 2) to Play Console Production track when ready.
- Confirm the in-app update prompt behaves as expected after two consecutive Play Store releases
  (can't be tested until there's an actual "newer version" on the Store to detect).
