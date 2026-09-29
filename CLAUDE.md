# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PunahChakra — a React Native (bare RN, not Expo-managed, though it uses select Expo modules for fonts/assets/location) community app for donating/redistributing reusable goods, backed by Supabase (Postgres + Auth + Edge Functions).

## Commands

```sh
npm start          # Metro dev server
npm run android     # Build & run on Android (requires Metro running separately, or it auto-starts one)
npm run ios         # Build & run on iOS (run `bundle install && bundle exec pod install` first if native deps changed)
npm run lint         # eslint .
npm test             # jest
```

No custom Jest config (uses `@react-native/jest-preset` directly, no custom `testMatch`), no ESLint rules beyond `@react-native`, and no TS path aliases — all imports are relative.

### Supabase (project ref `egigfrajfrkclohxksaa`, linked via Supabase CLI)

```sh
supabase functions deploy <name> --no-verify-jwt   # deploy an edge function (Docker not required; uploads directly)
supabase secrets set KEY=value                       # set edge function secrets
supabase secrets list
supabase db query --linked "<sql>"                    # run SQL directly against the live DB
supabase db query --linked -f path/to/file.sql         # run a SQL file against the live DB
```

There is no `supabase/migrations/` directory — schema changes are **not** tracked by the Supabase CLI's migration system. See "Database migrations" below.

## Architecture

### Data/API layer

All Supabase interaction (client setup, auth, and every table query) lives in a single file: `src/services/api.ts`. There's no per-domain service split — auth, profiles, pincode/availability, donations, pickups, and notifications functions are all exported from this one ~700-line file. When adding a new query, add it here rather than creating a new service module.

The Supabase client itself falls back to a hardcoded URL/anon key in `api.ts` if the env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) aren't set — this means the app "works" even without a `.env`, which can mask a missing/misconfigured environment.

### Navigation & role-based routing

`AppNavigator.tsx` (native-stack, root) decides the initial route from the cached/Supabase session **and** the user's `profiles.role`:
- `role === 'admin'` → `CollectorDashboard` (+ `CollectorProfile`, `AdminAvailability`)
- otherwise → `MainTabs` (wraps `TabNavigator.tsx`: Home / Map / Donate / Alerts / Profile bottom tabs)

Deep-linking is wired for `punahchakra://reset-password`, handling both PKCE-code and implicit-token password recovery flows.

Note: `src/screens/` also contains `RecyclerHome/Analytics/Inventory/Processing` screens for a third "recycler" role tier that is **not currently wired into `AppNavigator`** — treat these as legacy/unreachable unless you're specifically re-integrating that role.

### Auth: phone OTP login

Login is phone-number + OTP (not email/password, though legacy `signInUser`/`signUpUser` email-password functions and `ForgotPasswordScreen`/`ResetPasswordScreen` still exist in `api.ts` and navigation). The flow:

1. `LoginScreen` → `sendPhoneOtp()` → `supabase.auth.signInWithOtp({ phone })`
2. `VerifyPhoneOtpScreen` → `verifyPhoneOtp()` → `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`, then upserts the `profiles` row.

Supabase's built-in phone auth requires either a supported SMS provider (Twilio/MessageBird/Vonage) configured in the dashboard, **or** a custom **Send SMS Auth Hook**. This project uses the hook: `supabase/functions/send-sms-hook/index.ts` receives the Supabase-generated OTP and relays it through SMS Alert (smsalert.co.in) instead of a native provider. Key details for anyone touching this:

- The hook secret Supabase generates is prefixed `v1,` — that prefix must be stripped before passing to the `standardwebhooks` library, or signature verification fails.
- Every `Response` the function returns **must** set `Content-Type: application/json` explicitly — Deno's default (`text/plain`) is rejected by GoTrue's hook client with a 400 "Invalid JSON response" error, even though the hook call itself succeeded.
- The Phone provider must be toggled **on** in Supabase Dashboard → Authentication → Providers → Phone (separate from enabling the hook itself) or every OTP request fails with "Unsupported phone provider" regardless of hook config.
- SMS Alert's DLT-registered template text must be reproduced exactly in the function (variable slot `{#num#}` substituted with the OTP) — TRAI filtering rejects any deviation from the registered template.

### Database migrations

`src/migrations/*.sql` (001–019, hand-authored, not in `supabase/migrations/`) is the only history of schema changes. Because the Supabase CLI doesn't track these, **a migration file existing in the repo does not mean it's been applied to the live database** — verify with `supabase db query --linked "SELECT ...` before assuming a schema change (e.g. a trigger function's current definition) is live. `schema.txt` is a manually maintained schema snapshot and can also be stale (e.g. it still lists an old `role` CHECK constraint from before migration 012 renamed roles to `user`/`admin`).

The `handle_new_user` trigger (defined across migrations 001/012/014) inserts a `profiles` row whenever an `auth.users` row is created. Migration 014's version is required for phone-only signups to work (it `COALESCE`s `email`/`phone` instead of inserting `NULL` into the `NOT NULL` `email` column) — if phone signup fails with a Postgres "null value in column email" error, check whether 014's version of the function is actually live.
