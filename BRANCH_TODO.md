# BRANCH TODO – streak-gated cat generator rollout

## Goal

- Roll out the cat generator gradually based on each user’s attendance reporting streak.
- Gate access from the **thank you** page (not the main attendance form) and unlock cat-generator features as streak milestones are hit.

## Current context

- `/thank-you` already shows `StreakTracker` using `useUserDbData` (Supabase `responseStreak`), but does not link to `/cat-generator`.
- `/cat-generator` exists and is wrapped with `SessionBoundary`, yet it is not gated or linked from navigation.
- Streak data lives in Supabase (`SupabaseUser.data.responseStreak`, updated in `userUpdateSideEffects`).

## Agent constraints (must follow during this branch)

- Create frequent, self-contained, well-documented commits.
- Update this file (`BRANCH_TODO.md`) as progress is made (check items off + add brief notes when useful).
- Checkpoint with the user for any significant questions/changes (thresholds, feature set, telemetry approach).
- Prefer existing code patterns/styles in this repo; avoid inventing new patterns unless necessary.

## Decisions (locked unless explicitly revisited)

### System toggles/constants (Supabase-configurable)

Store system-level toggles/constants in a **dedicated Supabase table** (not environment variables), so they can be tuned without redeploy.

This includes:

- rollout kill switch
- streak thresholds
- admin/tester allowlist emails

Intended default values for this rollout:

- `CAT_GEN_ACCESS_STREAK=2`
- `CAT_GEN_CUSTOMIZE_STREAK=4`
- `CAT_GEN_EXPORT_STREAK=5`
- `CAT_GEN_RARE_TRAITS_STREAK=7`

### Telemetry sink + dashboard

- Implement lightweight telemetry for **impressions** and **clicks** in Supabase.
- Create a dedicated dashboard to track adoption and correlate with response/engagement over time.
- Do **not** store raw emails in telemetry. Use the existing Supabase anonymization approach (hashed IDs) used elsewhere in the codebase.

### Admin allowlist / bypass (Supabase-stored)

Allow specific users (admins/testers) to bypass streak checks during rollout using the same Supabase config table as the system toggles/constants.

Initial allowlist:

- `vehpus@gmail.com`
- `hellscorechoir.it@gmail.com`

### Downloads / export timing

- Enable **client-side SVG export** only once the user meets `CAT_GEN_EXPORT_STREAK`.
- If simple to implement, also support at least one of: PNG download, JPEG download, copy-to-clipboard (still gated behind `CAT_GEN_EXPORT_STREAK`).

## Testing expectations (must follow)

- Before starting rollout work, add tests covering the current behavior of the attendance form and streak tracking.
- Add tests alongside every new feature/step in this plan.
- Mock only when necessary (external APIs/network). Do not mock internal modules just to make a test pass.
- Tests must be deterministic and order-independent.
- Ensure tests run in CI and are part of deployment checks (at minimum: `pnpm test`, plus existing `pnpm lint`/`pnpm typecheck` if used by CI).

## Execution checklist (check off as completed)

### 0) Baseline safety net (tests first)

- [x] Add/expand tests for current attendance submission UI behavior (no cat rollout changes yet).
  - Completion criteria: tests assert key form states and submission interactions for `AttendanceForm` without relying on network calls.
- [x] Add/expand tests for current streak tracking rendering logic (no gating yet).
  - Completion criteria: tests cover `StreakTracker` rendering for representative streak values and loading/error states (mock only external data fetching).
- [x] Confirm test suite runs in CI/deployment checks.
  - Completion criteria: CI config (or documented scripts) runs `pnpm test` and fails the build on test failures.

### 1) Config + foundations

- [ ] Add Supabase config table(s) for the decided thresholds, rollout pause toggle, and admin allowlist. Move existing hardcoded / environment variable controlled constants to use this table. (Scaffolding added in `catGeneratorConfig.ts` to read the table with defaults; actual table provisioning still needed.)
  - Completion criteria: a dedicated table exists in Supabase; defaults match the Decisions section; rollout pause can disable all cat-generator gating/CTAs; admin emails are sourced from Supabase (not env vars).
- [x] Create a single helper for reading streak + eligibility safely. (Implemented `computeCatGeneratorEligibility` with defaults + tests.)
  - Completion criteria: helper handles loading/error/null; returns a normalized streak number + feature unlock booleans; unit tests cover edge cases.

### 2) Telemetry + dashboard (Supabase)

- [ ] Add Supabase telemetry table(s) + minimal write path for events (impression/click).
  - Completion criteria: telemetry stores only anonymized user IDs (no raw email); schema documented; unit tests cover anonymization helper usage.
- [ ] Add a Supabase dashboard specification (and/or saved chart definitions if supported in repo process).
  - Completion criteria: dashboard tracks impressions/clicks over time and can be segmented by event type; includes a view that helps correlate to attendance response rates.

### 3) Thank-you page CTA (entry point)

- [x] Add CTA to `/thank-you` (and only there) gated by `CAT_GEN_ACCESS_STREAK`.
  - Completion criteria: when eligible, CTA links to `/cat-generator`; when ineligible, show “X more reports to unlock cats” once streak is known. (Implemented with eligibility helper + basic test; telemetry still pending.)
- [ ] Log CTA impression + click events.
  - Completion criteria: telemetry events fire exactly once per page view for impression (no spam on rerender) and once per click.
- [ ] Add tests for CTA visibility + copy + telemetry behavior.
  - Completion criteria: tests cover eligible/ineligible/loading/error states; telemetry write mocked only at the boundary.

### 4) Route-level guard on `/cat-generator`

- [x] Add a client-side guard that enforces `CAT_GEN_ACCESS_STREAK`.
  - Completion criteria: below threshold redirects back to `/thank-you` with a friendly message; above threshold loads page normally; shows a loading state while streak is unknown. (Client-side lock screen implemented; still need redirect + loading polish.)
- [ ] Add Supabase-based admin bypass check.
  - Completion criteria: allowlisted emails bypass gating; list is sourced from Supabase; no raw email stored in telemetry.
- [ ] Add tests for guard redirect + allowlist bypass.
  - Completion criteria: deterministic tests cover below/above threshold + allowlist.
- [x] Translate cat generator page texts into Hebrew.
  - Completion criteria: all user-facing strings on `/cat-generator` are localized to Hebrew, consistent with other pages.
- [ ] Add basic UI test coverage for cat generator controls.
  - Completion criteria: tests assert controls render and update preview state; ideally established before further gating changes to ensure stability.

### 5) Incremental feature unlocks inside cat generator

- [ ] Phase A (>= access): show generated cat preview but lock customization controls.
  - Completion criteria: controls are disabled/read-only; UI communicates why and required streak.
- [ ] Phase B (>= customize): unlock customization controls.
  - Completion criteria: controls become interactive; tests cover locked vs unlocked behavior.
- [ ] Phase C (>= export): enable SVG export (and optionally simple PNG/JPEG/copy support).
  - Completion criteria: export UI is disabled below threshold; export works above threshold; tests cover gating and output generation for SVG.
- [ ] Phase D (>= rare traits): unlock rare palettes/traits.
  - Completion criteria: rare options are hidden/disabled below threshold; enabled above; tests cover unlock behavior.
- [ ] Update `thank-you` to reflect unlocked features as streak increases, and which milestone is next.
  - Completion criteria: dynamic messaging shows current unlocks and next milestone; tests cover messaging logic.

### 6) Rollout controls + QA

- [ ] Start disabled in production via kill switch; enable for allowlist first.
  - Completion criteria: kill switch off prevents CTA + route access for non-allowlist; allowlist bypass still works for testing.
- [ ] Manual QA sweep across streak values (0/1/2/4/5/7+) and auth states.
  - Completion criteria: CTA logic and redirects behave correctly; export is gated; telemetry appears in Supabase.
- [ ] Review telemetry/dashboard after rollout enablement.
  - Completion criteria: impressions/clicks increase as expected; no PII stored; dashboard usable for engagement monitoring.
