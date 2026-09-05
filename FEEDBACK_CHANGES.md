# PunahChakra Feedback — Change Log

This file tracks progress against the feedback list (mission/onboarding copy, item types,
booking rules, auth, UI polish, etc.). Read this file first at the start of every session
before making further changes, and append a new entry every time something is done so the
log stays a complete, current record — don't rely on chat history for this.

## Status legend
- ✅ Done and verified (built/run and checked in emulator or by reading code)
- 🚧 Done but not yet verified in the running app
- ⏳ Not started

---

## 🚧 Done but not yet verified in the running app

### Calendar-based pickup slots + removed admin approve/reject
Files: `src/migrations/013_add_day_availability.sql`, `src/services/api.ts`,
`src/data/AppDataContext.tsx`, `src/screens/AdminAvailabilityScreen.tsx` (new),
`src/screens/CollectorProfileScreen.tsx`, `src/screens/CollectorDashboardScreen.tsx`,
`src/screens/QualityScreen.tsx`, `src/screens/DonateScreen.tsx`, `src/screens/HomeScreen.tsx`,
`src/screens/PickupMapScreen.tsx`, `src/screens/ConfirmationScreen.tsx`,
`src/navigation/AppNavigator.tsx`

- New `day_availability` table (date-scoped `available_slots` + `is_closed`) replaces the
  flat, date-less `profiles.available_slots` for admin-configured availability. Requires
  running the migration SQL against Supabase manually (no auto-migration system exists) —
  **not yet applied to the production DB** as of this entry.
- New `AdminAvailabilityScreen`: a hand-built month calendar (no new dependency, matches the
  app's no-UI-kit convention) — admin taps a date, toggles slots and/or a "close this day"
  switch, saves. Reached from Profile → "Manage Pickup Calendar" (replacing the old flat
  slot-toggle "Availability" section).
- `DonateScreen`: replaced the native single-date `DateTimePicker` + slot modal with an
  inline week-strip (7-day paging) + always-visible slot grid for the selected day; shows
  "Not available on this day" when the admin closed it.
- Removed the collector "Confirm Pickup" claiming step entirely (`CollectorDashboardScreen`)
  — every scheduled pickup goes straight to Complete / View Map, no approve/reject gate.
  `QualityScreen`'s matching "Refuse Pickup Batch" (unassign-and-reopen) action, which only
  made sense with that claiming step, was removed too.
- Added `getStatusLabel()` in `api.ts` — single source of truth mapping DB status → display
  text, so `'pending'` (still the literal DB value at booking time, unchanged for schema
  safety) now reads as **"Pickup Scheduled"** everywhere instead of "PENDING".
- Admin gets a live in-app popup (`Alert.alert`) via a new Supabase realtime subscription in
  `AppDataContext` on new `donations` rows, in addition to the existing persisted
  notification row — no push-notification infrastructure was added (out of scope, confirmed
  with user).
- Verified live in Android emulator as the **user** role: week-strip paging, per-day slot
  fetch (booked slots correctly excluded per date), booking end-to-end, Home screen showing
  "Pickup Scheduled" with day/time immediately (no pending/approval delay), donation list
  status badges ("Cancelled"/"Completed"/"Pickup Scheduled") all correct.
- **Not yet verified**: admin-side screens (`AdminAvailabilityScreen`, the simplified
  `CollectorDashboardScreen`, the realtime popup) — no admin test credentials were available
  this session. Verified via `tsc --noEmit` (clean) and code review only.

---

## ✅ Done

### 1. Mission / onboarding slides 1–4 rewritten
Files: `src/screens/MissionFoundationsScreen.tsx`, `MissionCorePillarsScreen.tsx`,
`MissionLogisticsScreen.tsx`, `MissionDeploymentScreen.tsx`

- Replaced all "industrial revolution / B2B integration / enterprise-grade API /
  high-capacity logistics" copy with the actual punahchakra.com website voice.
- New structure: **Step 1: Collection → Step 2: Sorting → Step 3: Redistribution → Let's Get Started (CTA)**.
- Slide 1: "From Your Door, To Their Need" + founder/community framing, Doorstep/Community chips.
- Slide 2: "How We Sort Your Donations" — Careful Sorting (clothes/shoes/blankets/bags) + Quality Checked.
- Slide 3: "Giving Items a Second Life" — 0% Landfill Goal + Local Partners chips, plus a
  "A Student-Led Initiative" banner crediting founder Vivaan Mansukhani.
- Slide 4 (CTA): "Ready to Give Your Donations a Second Life?" replacing "Ready to Scale Your Impact?".
- Verified live in Android emulator — all 4 slides render correctly, no industrial language left.

### 2. Donate screen — multi-select item types
File: `src/screens/DonateScreen.tsx`

- Changed `selectedItem` (single string) → `selectedItems` (string array) with a `toggleItem` fn.
- Item cards (Clothes/Shoes/Blankets-Bedsheets/Bags) now show a checkbox and can be
  ticked independently — matches the website's "Clothes, Shoes, Bedsheet, Blanket, Bags" list.
- Estimated points now sum `calculateRewardForCategory` across all selected categories.
- `handleConfirm` blocks submission if zero items selected, and joins selected labels with
  ", " for the stored `category` string.
- Verified live: Clothes + Shoes both selectable independently, checkbox UI works.

### 3. Donate screen — booking time rules
File: `src/screens/DonateScreen.tsx`

- Replaced the native free-form time dial (`DateTimePicker` mode="time") with a fixed list
  of 30-minute slots from **11:00 AM to 5:30 PM** (last pickup window ends by 6:00 PM),
  shown in a bottom-sheet modal (`showSlotPicker` / `TIME_SLOTS`).
- Minimum bookable date pushed to **tomorrow** (`getTomorrow()` helper), blocking both
  same-day and past-date pickups (previously only past dates were blocked via `minimumDate={new Date()}`).
- Added helper text under the section label: "Pickups are available the next day onwards,
  between 11:00 AM - 6:00 PM."
- Verified live: date defaults to tomorrow, slot picker opens as a clean sheet, selecting
  a slot updates the button and closes the sheet correctly.

### 4. Minor copy cleanups in DonateScreen
- Banner subtitle "Book the next logistics window." → "Schedule your doorstep pickup."
- Loading overlay "Saving donation request to Supabase" → "Saving your donation request"
  (the word "Supabase" was never supposed to appear in UI per an existing code comment in
  `AppDataContext.tsx`, but was leaking through here).

### 5. `LoginScreen.tsx` industrial copy fixed
File: `src/screens/LoginScreen.tsx`

- Banner subtitle "Enter your credentials to access the logistics dashboard." →
  "Enter your credentials to continue giving items a second life."
- Bottom badges SECURE / INDUSTRIAL / ENTERPRISE (factory/robot icons) →
  SECURE / COMMUNITY-LED / 0% LANDFILL (heart/leaf icons), matching the mission-slide voice.
- Minor leftovers cleaned up: email placeholder `name@company.com` → `name@example.com`,
  footer "New to the platform?" → "New to PunahChakra?".
- ✅ Verified live in Android emulator — Sign In screen shows the updated banner subtitle
  and SECURE / COMMUNITY-LED / 0% LANDFILL badges exactly as coded.

### 6. Points/CO2 now credited on pickup completion, not scheduling
Files: `src/services/api.ts`, `src/screens/QualityScreen.tsx`,
`src/migrations/011_allow_collector_credit_donor_profile.sql`

Fixes the double-counting bug from feedback item #19 ("points credited when pickup is
scheduled" → should only credit after pickup completion).

- `createDonationRequest` (api.ts) no longer updates the donor's `profiles.points` /
  `co2_offset_kg` at scheduling time — it still computes and stores `points_awarded` on the
  donation row (used for the "Estimated EcoPoints" display), and the post-schedule
  notification copy now reads "You'll earn +X impact pts once it's picked up!" instead of
  claiming points were already earned.
- Added `creditDonorForCompletedDonation(donorId, pointsAwarded, co2OffsetKg)` (api.ts) —
  the single place donor points/CO2 get added to their profile.
- `QualityScreen.tsx` → `handleAcceptBatch` now calls `calculateRewardForCategory` +
  `creditDonorForCompletedDonation` for the donor immediately alongside the existing
  flat 20 pts/kg collector credit, so both sides are credited atomically at completion.
- Net effect: since donors are never credited early, `refusePickupInSupabase` needs no
  reversal logic — refusing/cancelling a pickup before completion now correctly grants zero
  donor points, with no code path left where a cancelled donation still holds points.
- ✅ Verified live. Ran a full donor-schedule → collector-confirm → collector-accept flow
  live against Supabase:
  - ✅ Scheduling a donation correctly awards the donor 0 points (only stores the estimate).
  - ✅ Collector confirming the pickup (`in_transit`) still correctly awards 0 points to
    either party — matches the "not until completion" intent exactly.
  - ✅ Collector accepting the batch in `QualityScreen` correctly credits the **collector**:
    +100 pts / +12.5 kg CO2 for a 5 kg batch (20 pts/kg, 2.5 kg CO2/kg), donation flips to
    `status: 'completed'`, `is_picked_up: true`.
  - ❌→✅ **Bug found and fixed**: the donor was never actually credited.
    `creditDonorForCompletedDonation` runs inside a `try {} catch {}` that swallows its
    result, so nothing surfaced in the UI — but checking the DB directly showed the donor's
    `points`/`co2_offset_kg` stayed at 0 after acceptance. Root cause: the existing
    `"Users update own profile" ON UPDATE USING (auth.uid() = id)` RLS policy on `profiles`
    only lets a user update *their own* row — but the session performing this update is the
    **collector's**, updating the **donor's** row. Confirmed directly via a raw REST PATCH
    as the collector's own auth token: it returned `[]` (zero rows matched/affected, no
    error thrown) instead of updating the row. This means donors had *never* been able to
    receive pickup-completion credit in this build, silently, regardless of this fix's own
    logic being otherwise correct.
    - Fix: added `src/migrations/011_allow_collector_credit_donor_profile.sql`, a second
      permissive `ON UPDATE USING (true)` policy on `profiles` (mirroring the already-open
      `USING (true)` policy this schema already uses for `donations`/`pickups`), so a
      collector's session can write the donor's credit. Migration applied to the live
      Supabase project (2026-09-03).
    - Re-verified end to end with a fresh donor/collector pair after applying the migration:
      donor correctly credited +600 pts / +12.5 kg CO2, collector correctly credited an
      additional +100 pts / +12.5 kg CO2 (running total 200 pts / 25 kg), donation status
      `completed`. Confirmed via direct DB queries, not just UI.

### 7. Removed Collector self-signup option
File: `src/screens/SignUpScreen.tsx`

- Deleted the Donor/Collector role-picker UI (`role` state, both role cards, and the now-
  unused `roleHeaderLabel`/`roleSelectionRow`/`roleCard*`/`roleTitle`/`roleSub` styles).
  `SignUpScreen` is the only self-registration route wired into navigation
  (`AppNavigator.tsx`), so this closes off collector self-signup entirely — `signUpUser` is
  now always called with role `'donor'` and always routes to `MainTabs` on success.
- Collector accounts will need to be provisioned another way (e.g. directly in the
  Supabase `profiles` table) since there's no in-app vetted onboarding flow for them yet —
  flagging this as a follow-up if collectors need a real signup path later.
- Also cleaned up matching industrial-tone placeholder `you@company.io` → `you@example.com`,
  consistent with the [LoginScreen fix](#5-loginscreentsx-industrial-copy-fixed).
- ✅ Verified live in Android emulator — Create Account screen shows only Full Name/Email/
  Password fields, no Donor/Collector role picker.

### 8. New pickup requests start as "Pending" instead of auto-"scheduled"
Files: `src/services/api.ts`, `src/screens/DonateScreen.tsx`, `src/screens/ConfirmationScreen.tsx`,
`src/screens/HomeScreen.tsx`, `src/screens/UserProfileScreen.tsx`, `src/screens/QualityScreen.tsx`

- `createDonationRequest` (api.ts) now inserts new donations with `status: 'pending'`
  instead of `'scheduled'` — `'pending'` was already an allowed value in the DB's
  `donations_status_check` constraint (migration 005), so no schema change was needed.
- Collector-side "available job" and "confirm" logic (`CollectorDashboardScreen.tsx`) was
  already gated on `is_picked_up` / `confirmed_by` / `collector_id`, not on
  `status === 'scheduled'` — confirmed via code search, so collectors still see and can
  confirm pending pickups with zero changes there. The actual "confirm" step
  (`confirmPickupInSupabase`) is what now performs the real scheduling transition
  (`pending` → `in_transit`).
- `refusePickupInSupabase` (api.ts) and the equivalent inline fallback in
  `QualityScreen.tsx` → `handleRefuseBatch` now reset a refused donation back to
  `'pending'` (was `'scheduled'`) so the lifecycle stays consistent: pending until a
  collector actually confirms.
- Donor-facing copy updated to stop claiming the pickup is already confirmed:
  - `DonateScreen.tsx` success alert: "Pickup Scheduled" → "Pickup Requested", body now
    says "awaiting collector confirmation".
  - `ConfirmationScreen.tsx`: title "Pickup Scheduled Successfully!" → "Pickup Request
    Submitted!", subtitle "has been dispatched to nearby logistics partners" → "is awaiting
    confirmation from a nearby collector", badge "Confirmed" (success) → "Pending" (warning).
  - `api.ts` post-request notification: "Pickup Request Scheduled" → "Pickup Request
    Submitted", body now says "is pending collector confirmation" instead of "has been
    confirmed".
- `HomeScreen.tsx`'s "active donation" lookup and `UserProfileScreen.tsx`'s in-progress
  count now also match `status === 'pending'` (kept the old `'scheduled'`/`'assigned'`
  checks too, so any pre-existing rows already in that state still display correctly).
- ✅ Verified live in Android emulator: new donation lands as `status: 'pending'` with
  "Pickup Requested" / "awaiting collector confirmation" copy; collector confirming it
  flips it to `in_transit` (the real scheduling transition), matching the intended
  lifecycle exactly.

### 9. Edit / Cancel a pending pickup request
Files: `src/services/api.ts`, `src/screens/DonateScreen.tsx`, `src/screens/ProfileScreen.tsx`,
`src/navigation/TabNavigator.tsx`, `src/screens/CollectorDashboardScreen.tsx`

Only donations still in `status === 'pending'` (i.e. not yet confirmed by a collector, per
item #8 above) can be edited or cancelled — once a collector confirms, the request is locked.

- Added `cancelDonationRequest(donationId, requestId?)` (api.ts) — sets `donations.status`
  to `'cancelled'` (already a DB-allowed value per migration 005, no schema change needed).
- Added `rescheduleDonationRequest(donationId, updates)` (api.ts) — updates category, weight,
  pickup day/slot, instructions, and address in place, recalculates `points_awarded` via
  `calculateRewardForCategory`, and keeps the matching `pickups` row's address/weight/time
  in sync so collectors see the latest details.
- `DonateScreen.tsx` now doubles as the edit form: it reads `route.params?.editDonation`
  (an existing `DonationItem`) and, when present, prefills item checkboxes (matched from the
  stored `category` string back to `ITEM_TYPES`), quantity, time slot (if it matches an
  existing `TIME_SLOTS` entry), address, and notes, then calls `rescheduleDonationRequest`
  instead of `createDonationRequest` on submit. The pickup date itself is **not** prefilled
  (only a formatted day string like "Wed, Aug 26" is stored, with no year, so it can't be
  parsed back reliably) — editing always asks the donor to reconfirm a date, which doubles
  as the "reschedule" step. Header/banner/button copy switch to "Edit Pickup" /
  "Update pickup" / "Pickup Updated" in edit mode.
- `ProfileScreen.tsx` → "Recent activity" rows now show **Edit**/**Cancel** buttons under any
  donor donation with `status === 'pending'`. Edit navigates to the `Donate` tab with
  `{ editDonation: item }`; Cancel confirms via `Alert` then calls `cancelDonationRequest`
  and reloads the list.
- `CollectorDashboardScreen.tsx`: `allDonations` now filters out `status === 'cancelled'`
  before computing the pending-jobs count/weight and rendering the pickup list — otherwise a
  cancelled request would still show up as an "available job" for collectors to confirm,
  since the existing filters only excluded `'completed'`/`'collected'`, not `'cancelled'`.
- ✅ Verified live in Android emulator: create → Edit (correct prefill, title, button copy) →
  Cancel (confirm alert → DB `status` flips to `cancelled`, buttons disappear) all work.
- **Bug found and fixed during verification**: the original `TabNavigator.tsx` approach —
  a `tabPress` listener on the `Donate` tab calling `navigation.setParams({ editDonation:
  undefined })` — never actually took effect. `SET_PARAMS` applies to the navigator's
  *currently focused* route unless an explicit `source` is given, and Donate isn't focused
  yet when `tabPress` fires; even retargeting it via `CommonActions.setParams` +
  `source: e.target` updated the underlying navigation state but never reached the
  already-mounted `DonateScreen` instance (confirmed via logging: the component never
  re-rendered at all when switching back to the Donate tab). Net effect: after using Edit
  once, tapping the Donate tab icon kept reopening the stale edit session — wrong title,
  wrong prefilled fields, wrong stored id — indefinitely, exactly the bug item #9 was
  supposed to prevent.
  - Fix: moved the reset entirely into `DonateScreen.tsx` itself. `editDonation` is now local
    state (not derived from `route.params` on every render), refreshed from `route.params`
    via a `useEffect` when ProfileScreen navigates in with a new one, and explicitly cleared
    — both the local state and `navigation.setParams({ editDonation: undefined })` on
    itself — via a `navigation.addListener('blur', ...)` callback fired the moment the
    screen loses focus. A screen's own `setParams` unambiguously targets its own route, so
    this sidesteps the cross-screen `source` targeting problem entirely. Removed the
    ineffective `tabPress` listener from `TabNavigator.tsx`.
  - Verified the fix directly: Edit → switch to Home → switch to Donate now correctly shows
    a fresh "Schedule" form (not "Edit Pickup"), repeatedly, across multiple round-trips.

### 10. Collector-side availability slot picker
Files: `src/migrations/010_add_collector_available_slots.sql`, `src/constants/timeSlots.ts`
(new), `src/services/api.ts`, `src/screens/CollectorProfileScreen.tsx`,
`src/screens/DonateScreen.tsx`

Scoped with the user: this implements the "set general availability" interpretation of
"Collector should be able to show/select available slots" — a settings section where a
collector marks which of the fixed slots they're generally free during. It does **not**
filter donor-facing slots by collector availability or add per-pickup negotiation — those
were explicitly out of scope for this pass.

- New migration adds `profiles.available_slots TEXT[] DEFAULT '{}'` — no existing column/
  table for this existed anywhere in the schema.
- Extracted the donor-side `TIME_SLOTS` (11:00 AM–6:00 PM, 30-min increments) out of
  `DonateScreen.tsx` into a shared `src/constants/timeSlots.ts` so both the donor booking
  form and the new collector settings section stay in sync on the same slot list.
  `DonateScreen.tsx` now imports it instead of defining its own copy.
- `UserProfile` (api.ts) gained `available_slots?: string[]`; no new API function was
  needed since `updateUserProfile` already accepts any `Partial<UserProfile>`.
- `CollectorProfileScreen.tsx` gained an "Availability" card: tappable slot chips (same
  chip UI pattern as `DonateScreen.tsx`'s slot picker) that toggle membership in
  `available_slots`, plus a "Save Availability" button that calls `updateUserProfile` and
  `refreshProfile()`. Prefills from the collector's existing `profile.available_slots`.
- ✅ Verified live: migration applied (2026-09-03), `profiles.available_slots` column
  confirmed present. Selected "11:00 AM" and "12:00 PM" as a collector, saved, force-stopped
  and relaunched the app — both slots still showed selected on reload, confirming the
  round-trip through Supabase (not just local state).

### 11. Fixed auto-login
Files: `src/services/api.ts`, `src/navigation/AppNavigator.tsx`, `src/screens/ProfileScreen.tsx`

Root cause: the Supabase client (`createClient` in `api.ts`) was created with
`persistSession: true` but **no `storage` adapter**. supabase-js defaults to browser
`localStorage`, which doesn't exist in React Native — so the session was only ever held in
memory and silently vanished on every cold app launch, even though the app's own
`@punahchakra_user_logged_in` AsyncStorage flag still said `'true'`.

- `api.ts`: `createClient(...)`'s `auth` config now passes
  `storage: AsyncStorage` (from `@react-native-async-storage/async-storage`, already a
  project dependency) and `detectSessionInUrl: false`, so `persistSession` actually
  persists across app restarts and `supabase.auth.getSession()` returns a real session on
  cold boot.
- `AppNavigator.tsx` → `checkInitialSession`: previously, if the `USER_LOGGED_IN_KEY` cache
  said `'true'` but `supabase.auth.getSession()` came back with no session (exactly the
  broken case above), the code did nothing in either branch — it silently kept routing to
  `MainTabs`/`CollectorDashboard` with no real authenticated session underneath, so screens
  that fetch user data would just come up empty. Now that "stale flag, no real session" case
  explicitly clears `USER_LOGGED_IN_KEY`/`LAST_ROLE_KEY` and falls through to the normal
  onboarding-complete check (Landing vs MissionFoundations).
- `ProfileScreen.tsx` → `handleSignOut` called `supabase.auth.signOut()` directly without
  clearing `USER_LOGGED_IN_KEY`/`LAST_ROLE_KEY` (unlike `AppDataContext.tsx`'s `signOut()`,
  used by `CollectorProfileScreen.tsx`, which already cleared them correctly). Fixed to clear
  both keys before signing out, so a donor who signs out doesn't get auto-routed back into a
  sessionless `MainTabs` on next launch.
- ✅ Verified live in Android emulator: force-stopped the app while logged in as a real
  donor account and relaunched — landed straight back on the Home tab, still authenticated,
  repeatedly across multiple force-stop/relaunch cycles during this session.

### 12. RoleSelectionScreen fixes
Files: `src/screens/RoleSelectionScreen.tsx`, `src/components/Card.tsx`

Scoped with the user as a surgical bug-fix pass — this screen's 4 roles (Citizen/
Recycler/Logistics/Quality) are leftover industrial-era content disconnected from the
app's real accounts (donor/collector only) and don't persist anything on Continue; a full
IA rework was explicitly out of scope, kept for the separate tracked Landing-page redesign.

- **Duplicate-looking role data**: fixed the literal "Logistics / Fleet Fleet" typo to
  "Logistics / Fleet", and changed the Recycling Facility card's color from `#15A800`
  (identical to the Citizen card) to a distinct teal `#0891B2` so the two top cards are no
  longer visually indistinguishable at a glance.
- **Header/logo spacing**: the screen previously had no header banner at all — just a bare
  back arrow floating above the title with no logo, unlike every other auth-adjacent screen
  (`LoginScreen.tsx`, `SignUpScreen.tsx`). Added a green rounded-bottom `topBanner` (same
  pattern as `LoginScreen.tsx`) containing the back button, the PunahChakra logo, and the
  title/subtitle, moved out of the scrolling content so it stays fixed at the top.
- **Non-clickable options**: live emulator testing to reproduce this was inconclusive (ADB
  taps kept landing on stale/transitioning screens — a testing artifact, not a confirmed
  finding), so no cause was proven. Applied the two defensible, no-risk fixes found via code
  review: replaced the role cards' object-spread style merge
  (`{ ...styles.roleCard, ...styles.selectedRoleCard }`, an undocumented RN pattern) with
  proper array-style composition (`[styles.roleCard, isSelected && styles.selectedRoleCard]`)
  and widened `Card.tsx`'s `style` prop type from `ViewStyle` to `StyleProp<ViewStyle>` to
  support it correctly; added explicit `hitSlop` to the back button. If cards are still
  unresponsive after this, it needs a live device repro to diagnose further.
- 🚧 Not yet verified live in emulator — `tsc --noEmit` passes clean.

### 13. Full visual re-theme (2026-09-02) — closes "App colour theme review" backlog item
Files: `src/theme/theme.ts`, `App.tsx`, `src/navigation/TabNavigator.tsx`, all 8
`src/components/*.tsx`, `src/components/ProgressRing.tsx` (new), and every screen wired
into `AppNavigator.tsx`.

Implements the forest-green + teal-blue redesign concept the user shared (mockup
published as an artifact), replacing the stock `#15A800` green-only palette per the
"App colour theme review (green + blue combination instead of green-only)" and
"General UI/design alignment and spacing pass" backlog items above.

- Added `expo-font`, `@expo-google-fonts/fraunces`, `@expo-google-fonts/inter`,
  `react-native-svg` (for the new `ProgressRing` component). Fonts load via `useFonts()`
  in `App.tsx` behind a loading gate.
- `theme.ts`: new palette (forest `#28402F` primary, teal-blue `#2C6E8E` secondary, warm
  paper `#EFE8D8` background, new `colors.clay`), added `fonts` export and `fontFamily`
  on every `typography` entry (Fraunces for headings, Inter for body/UI).
- `TabNavigator.tsx`: tab bar re-themed, Donate tab now a raised FAB-style circle
  (mockup's `.fab-tab`) instead of a flat icon-in-pill.
- `HomeScreen.tsx`: impact card's linear progress bar replaced with the new circular
  `ProgressRing` (the "chakra" motif).
- `DonateScreen.tsx`: item-type selector restyled to the mockup's chip/checkbox pattern
  (existing multi-select logic untouched).
- `ProfileScreen.tsx`: impact card restyled to an ink-background band with a marigold
  point value, matching the mockup.
- `QualityScreen.tsx`, `CollectorDashboardScreen.tsx`, `CollectorProfileScreen.tsx`,
  `AlertSettingsScreen.tsx`, `CollectionScreen.tsx`, `ForgotPasswordScreen.tsx`,
  `HelpSettingsScreen.tsx`, `NotificationsScreen.tsx`, `PersonalSettingsScreen.tsx`,
  `PickupMapScreen.tsx`, `PrivacySettingsScreen.tsx`: mechanical hex-literal → theme
  token pass (colors + font weights → `theme.fonts`), no layout/logic changes.
- Also spot-fixed leftover `#15A800` literals found outside the above set, in screens
  that otherwise already imported `theme`: `RoleSelectionScreen.tsx`,
  `MissionCorePillarsScreen.tsx`, `MissionLogisticsScreen.tsx`, `LandingScreen.tsx`,
  `LoginScreen.tsx`.
- Explicitly out of scope for this pass: `RecyclerAnalyticsScreen.tsx` /
  `RecyclerHomeScreen.tsx` / `OnboardingPillarsScreen.tsx` (not wired into
  `AppNavigator.tsx` — dead code, left untouched); a rebuilt phone-OTP illustrated
  sign-in hero (the app's real auth is email/password, unrelated to this visual pass);
  extracting a shared `Header`/`TopBar` component to de-duplicate the ~19 copy-pasted
  header blocks found during scoping (flagged as a good follow-up, not done here).
- 🚧 Not yet verified live in emulator — `tsc --noEmit` passes clean across the whole
  project.

### 14. FAQ – Donate Item copy fix + Help Center search
File: `src/screens/HelpSettingsScreen.tsx`

- Removed the "How is my impact calculated?" and "How do collectors verify batches?" FAQ
  entries per feedback (they described internal mechanics not meant to be user-facing copy).
- Expanded the "How do I schedule a pickup?" answer with real detail matching the actual
  app flow: selecting item types, picking a next-day-onwards slot, and the
  pending → collector-confirmed → completed lifecycle (per item #8's status rework).
- Reworded "Can I reschedule or cancel?" to match the real edit/cancel flow from item #9
  (locked once a collector confirms) instead of the old, inaccurate "up to 2 hours prior"
  claim.
- Added a FAQ search box (`InputField`, reusing the existing component) that filters the
  FAQ list by question/answer text — closes the "add search" part of the Help/Contact
  feedback item.
- Contact email (`info.punahchakra@gmail.com`) left as-is — confirmed with the user this
  address is current, not stale.
- **Bug found and fixed during live verification**: the "Email Support
  (info.punahchakra@gmail.com)" button had a fixed `height: 48` pill with the full string
  crammed in next to the icon — on real screen widths the text wrapped to two lines and got
  clipped/overlapped by the icon instead of growing the button. Shortened the button label
  to just "Email Support" (icon + text, single line) and moved the actual address to its
  own centered caption line below the button inside the same banner card. Removed the
  now-unnecessary `flex: 1` from `emailBtn` and added horizontal padding.
- ✅ Verified live in Android emulator after the fix — button no longer clips, full email
  address readable underneath.

### 15. Pickup location pin now uses real device GPS instead of a randomized Noida fallback
Files: `src/screens/DonateScreen.tsx`, `package.json` (added `expo-location`)

Root cause: `DonateScreen.tsx`'s "Use Current Location" button and its map-drag handler
never actually read the device's GPS — they generated **fake** coordinates
(`28.5833 + Math.random() * 0.008 - 0.004`, and a `Math.floor(...)` fake house number)
jittered around a single hardcoded Noida Sector 15A point, regardless of the donor's real
location. `PickupMapScreen.tsx`'s own hardcoded Noida fallback (used only when no
`Lat:/Long:` substring is parseable from the stored address) is a *secondary* symptom of
this — every donation's address already contained fake Noida-area coordinates, so that
fallback was rarely hit but the pin was still wrong at the source.

- Added `expo-location` (`npx expo install expo-location` — SDK-version-matched).
- `handleGetLocation`: now calls `Location.requestForegroundPermissionsAsync()` +
  `Location.getCurrentPositionAsync()` for the real device coordinates, then
  `Location.reverseGeocodeAsync()` to build a real street-level address string (falls back
  to bare "Lat/Long" text if reverse geocoding fails), replacing the old
  `PermissionsAndroid` + `Math.random()` fake-address logic.
- `handleMapMessage` (fired when the donor drags the pin on the in-app map): same
  reverse-geocode-real-coordinates treatment, replacing the old fake
  `House #${Math.floor(...)}, Sector 15A` string.
- Native `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION` permissions were already present
  in `AndroidManifest.xml` from a prior pass — no manifest change needed, but the native
  Android build needs a rebuild to pick up the new `expo-location` native module (same as
  any new native dependency, e.g. `react-native-svg` in item #13).
- 🚧 Not yet verified live — requires a native rebuild (not just a JS reload) to test on
  device/emulator; `tsc --noEmit` passes clean.

### 16. Fixed "Forgot Password" reset link — app never handled the incoming deep link
Files: `src/screens/ResetPasswordScreen.tsx` (new), `src/navigation/AppNavigator.tsx`,
`android/app/src/main/AndroidManifest.xml`, `ios/PunahChakra/Info.plist`

Root cause: `ForgotPasswordScreen.tsx` already correctly asked Supabase to send a reset
email with `redirectTo: 'punahchakra://reset-password'`, but nothing in the app could ever
receive that link — there was no `punahchakra://` URL scheme registered on **either**
platform (checked both `AndroidManifest.xml`'s intent-filters and
`ios/PunahChakra/Info.plist`'s `CFBundleURLTypes` — neither existed), no deep-link handling
anywhere in `AppNavigator.tsx`, and no screen to actually set a new password once the link
was followed. So tapping the email's reset link had no app-side effect at all, regardless
of anything on the Supabase dashboard side — this was the actual cause of "reset email link
not working," not just the sender-name cosmetic issue.

- Registered the `punahchakra://` scheme: added a `VIEW`/`BROWSABLE` intent-filter with
  `<data android:scheme="punahchakra" />` to `MainActivity` in `AndroidManifest.xml`, and a
  `CFBundleURLTypes` entry in `Info.plist` for iOS.
- New `ResetPasswordScreen.tsx`: a new-password + confirm form that calls
  `supabase.auth.updateUser({ password })`, gated on an active (recovery) session existing;
  if the session's missing/expired it redirects back to `ForgotPassword` with an
  "Link Expired" alert instead of silently failing.
- `AppNavigator.tsx`: added `parseRecoveryParams`/`handleRecoveryUrl` to read the incoming
  URL from `Linking.getInitialURL()` (cold start) and `Linking.addEventListener('url', ...)`
  (already running), handling both Supabase flows — `access_token`/`refresh_token` in the
  URL fragment (implicit flow) and a `code` query param (PKCE flow) — since the project's
  `createClient()` call doesn't pin `flowType`, either could show up. On a successful
  `setSession`/`exchangeCodeForSession`, navigates to the new `ResetPassword` screen (via a
  `createNavigationContainerRef` so this works both on cold start and while the app's
  already open).
- Still needs from Shivan/Supabase-project-access: add `punahchakra://reset-password` to
  the project's Auth → URL Configuration → Redirect URLs allow-list — Supabase silently
  drops `redirectTo` values not on that list, so this in-repo fix has a real dependency on
  one dashboard setting (separate from, and simpler than, the sender-name cosmetic issue
  above).
- 🚧 Not yet verified live — requires a native rebuild (new Android intent-filter / iOS
  Info.plist entry, like item #15) plus the dashboard allow-list entry above before an
  actual email round-trip can be tested end-to-end. `tsc --noEmit` passes clean.

### 17. Donate FAB now genuinely centered — added a real "Map" tab, fixed a donor privacy leak
Files: `src/navigation/TabNavigator.tsx`, `src/screens/PickupMapScreen.tsx`,
`src/data/AppDataContext.tsx`

The Donate tab's raised FAB circle (item #13) was never actually centered — with 4 tabs
(Home, Donate, Alerts, Profile) the screen's true center falls on the boundary *between*
tabs 2 and 3, not on tab 2 itself. Fixing this needed a 5th tab so Donate could sit as the
literal middle item.

- Considered reusing `MapScreen.tsx` for the new 2nd-place tab, but it turned out to be
  fully mock/placeholder content (fake "GreenLoop Processing Hub" names, static
  percentage-positioned pins, a dead "Navigate to Drop Center" button) — left untouched,
  still not wired into any navigator.
- Considered a "nearby collectors" map instead, but confirmed via the schema
  (`src/migrations/`) and `UserProfile`/`DonationItem` types in `api.ts` that **no real
  collector location data exists anywhere** — collectors only have `available_slots`
  (item #10), no address/lat/lng. Building that for real would mean a new schema column
  plus a collector-side location feature, out of scope for a tab-bar layout fix.
- Landed on reusing the existing, already-real `PickupMapScreen.tsx` (Leaflet/WebView,
  same pattern as item #16's GPS work) as the new **Map** tab, showing the donor's own real
  pickup pins instead of fake hub data:
  - `TabNavigator.tsx`: new tab order is Home → **Map** → **Donate (now centered)** →
    Alerts → Profile.
  - `PickupMapScreen.tsx`: added `route.name === 'Map'` detection (`isTabRoot`) to hide the
    back arrow / retarget the profile-avatar button correctly when rendered as a tab root
    vs. pushed as the `PickupMap` stack screen (used elsewhere for "Track this pickup" with
    a specific `donationId`) — same component serves both, since `route.name` differs
    between the two registrations.
  - Falls back to the donor's most recent pickup as the map's centered target when no
    explicit `donationId` param is given (i.e. opened from the tab rather than "Track this
    pickup").
  - Added a real empty state ("No pickups yet" + a "Schedule a Pickup" CTA into the Donate
    tab) for donors with zero donations, replacing the old fake "Sector 15A Center" filler
    marker in that case.
  - Bottom info panel now shows real activity ("You have N pickups shown on the map above")
    for donors instead of a static "service coverage" claim (kept the coverage copy for
    collector mode, where it's still accurate).
- **Bug found and fixed while verifying this**: `PickupMapScreen.tsx`'s donor mode plotted
  **every donor's** donations unfiltered, not just the current user's — a real privacy leak
  (any donor could see other donors' pickup addresses). Root cause was two-fold: (1) the
  screen itself never filtered by `donor_id`, now fixed with
  `donations.filter(d => d.donor_id === authUser?.id)`; (2) `AppDataContext.tsx`'s
  `loadUserData` always called `fetchAllScheduledDonations()` regardless of role on initial
  app load (only `refreshDonations()` correctly branched by role) — fixed to match
  `refreshDonations`'s existing `role === 'collector' ? fetchAllScheduledDonations() :
  fetchUserDonations(userId)` branch.
- ✅ Verified live in Android emulator: 5-tab bar renders with Donate visually centered;
  Map tab shows the donor's real donations (4 pickups, reverse-geocoded real address
  "H8M8+GW5, Sector 2, Noida, Uttar Pradesh, 201301" from the GPS work in item #16) with no
  back arrow; confirmed the header/CTA navigation buttons work correctly from the tab
  context.

### 18. Fixed invisible map pins in both Leaflet WebViews (PickupMapScreen + DonateScreen)
Files: `src/screens/PickupMapScreen.tsx`, `src/screens/DonateScreen.tsx`

While verifying item #17's new Map tab, the map rendered correctly (tiles, address text,
"You have 4 pickups" count) but **no pin markers were ever visible** — reported by the user
after live testing. Added a temporary `window.onerror` handler inside the WebView's inline
`<script>` (piped out via `postMessage`/`onMessage`, since a WebView's JS errors are
otherwise completely invisible to React Native) to actually see what was failing, which
surfaced two distinct real bugs:

1. **Root cause (the actual reason nothing showed):** the "Active Zones" circle overlay
   referenced `theme.colors.primary` directly inside the injected JavaScript string instead
   of interpolating it — `L.circle([...], { color: theme.colors.primary, ... })` — a
   pre-existing bug (not introduced this session). Since `theme` doesn't exist inside the
   WebView's JS context, this threw `ReferenceError: theme is not defined` and silently
   halted the entire script right there — meaning the marker-drawing code that runs after
   it never executed at all, regardless of how correct that code was. Fixed by actually
   interpolating the values: `` color: '${theme.colors.primary}' ``.
2. **Second, independent bug this masked:** Leaflet's default marker icon auto-detects its
   own image path from the `<script src="...">` tag that loaded it, which fails when the
   page is served from an inline HTML string (as it is here) rather than a real URL — so
   even with bug #1 fixed, markers would have rendered with **no visible icon** (broken
   image, but still clickable/functional). Fixed in both `PickupMapScreen.tsx` and
   `DonateScreen.tsx`'s embedded maps by explicitly setting
   `L.Icon.Default.mergeOptions({...})` with absolute CDN icon URLs before any markers are
   created.
- Kept the `window.onerror` → `postMessage` safety net in both screens' injected scripts
  (not just as a debugging aid removed afterward) — a WebView swallowing its own JS errors
  silently is exactly what hid bug #1 for as long as it did, so this stays in place for any
  future issue in either embedded map.
- ✅ Verified live in Android emulator: two blue pin markers now render correctly on the
  Map tab at the real donation coordinates near Sector 2, Noida, matching the reverse
  geocoded address text shown above the map.

### 19. Satellite view added to the Donate screen's location-picker map
Files: `src/screens/DonateScreen.tsx`

The Map tab (item #17) already had a Street/Satellite toggle (from the original
`PickupMapScreen.tsx`), but the separate pin-drag map used when scheduling a pickup
(`DonateScreen.tsx`'s "Expand Map" modal) only ever had street tiles with no toggle at all.

- Added `mapType` state (`'street' | 'satellite'`), mirroring `PickupMapScreen.tsx`'s
  existing pattern.
- `leafletHtml` now loads both an OSM street tile layer and the Esri World Imagery
  satellite layer, adding whichever one matches `mapType` to the map.
- Added the same Street/Satellite toggle UI (pill buttons) to the fullscreen map modal's
  header area.
- ✅ Verified live in Android emulator: toggled to Satellite and confirmed real satellite
  imagery loads in place of the street tiles, with the draggable pickup pin still correctly
  visible on top.

---

## 🔎 Discovered (not authored by this session, but relevant)

**Shivan already started the E-WASTE → Clothes/Shoes/Blankets/Bags pivot, uncommitted.**
Found uncommitted working-tree changes (not yet committed to git) across:
`HomeScreen.tsx`, `MapScreen.tsx`, `QualityScreen.tsx`, `CollectorDashboardScreen.tsx`,
`ConfirmationScreen.tsx`, `HelpSettingsScreen.tsx`, `ScheduleDonationScreen.tsx`, `api.ts`
— all consistently swapping E-WASTE/PAPER/Plastics/Metals/Glass mock data and reward
rules over to Clothes/Shoes/Blankets/Bags. A new untracked migration file
`src/migrations/009_update_category_points_types.sql` deletes E-WASTE/PAPER from the DB's
`category_points` table. This work was built on top of, not overwritten.

~~**Confirmed live bug**: `LoginScreen.tsx` still shows "Enter your credentials to access the
logistics dashboard" with SECURE / INDUSTRIAL / ENTERPRISE badges.~~ Fixed — see item #5.

~~**Points/CO2 double-counting bug**: donors were credited full reward points the moment
they scheduled a pickup, before any collector confirmed anything.~~ Fixed — see item #6.

---

## ⏳ Not started yet (from the feedback list)

- Phone number mandatory at signup + Mobile OTP registration/login.
- "Forgot Password" sender name shows "Supabase Auth" instead of "PunahChakra" — this half
  lives in the Supabase dashboard's email template/SMTP settings, not this repo; still flag
  to Shivan/whoever has Supabase project access. (The "reset link not working" half of this
  item turned out to be an in-repo bug — see item #16, now fixed.)
- Logo / app icon fit and clarity (launcher icon, not the in-app Mission header logo which
  was checked and renders fine after first cold-start frame).
- Landing page: show PunahChakra logo before login (currently "PUNAHCHAKRA INDUSTRIAL
  SYSTEMS" branding on `WelcomeScreen.tsx` — an orphaned screen not even wired into navigation
  currently; `LandingScreen.tsx` is the real post-onboarding screen and still needs a
  TooGoodToGo/Ecocrew-style front-screen redesign).
- General UI/design alignment and spacing pass.
- Play Store listing: description/screenshots don't reflect the app's actual nature of work.
