# BRANCH TODO – streak-gated cat generator rollout

## Goal
- Roll out the cat generator gradually based on each user’s attendance reporting streak.
- Gate access from the **thank you** page (not the main attendance form) and unlock cat-generator features as streak milestones are hit.

## Current context
- `/thank-you` already shows `StreakTracker` using `useUserDbData` (Supabase `responseStreak`), but does not link to `/cat-generator`.
- `/cat-generator` exists and is wrapped with `SessionBoundary`, yet it is not gated or linked from navigation.
- Streak data lives in Supabase (`SupabaseUser.data.responseStreak`, updated in `userUpdateSideEffects`).

## Plan
1) **Data + gating foundation**
   - Add a small helper to read `responseStreak` safely (loading/error/null handling) from `useUserDbData`.
   - Define env/config thresholds (e.g., `CAT_GEN_ACCESS_STREAK`, `CAT_GEN_CUSTOMIZE_STREAK`, `CAT_GEN_EXPORT_STREAK`, `CAT_GEN_RARE_TRAITS_STREAK`) with sensible defaults (1/3/5/10) and allow overrides per environment.
   - Keep a feature-flag kill switch (boolean) so the rollout can be paused without redeploy.

2) **Access from thank-you page (not main form)**
   - Insert a CTA on `/thank-you` that appears only when a logged-in user meets `CAT_GEN_ACCESS_STREAK`; otherwise show progress text (“X more reports to unlock cats”) once streak is known.
   - CTA click opens `/cat-generator`; log impressions/clicks via a lightweight event sink (Supabase table or Sentry breadcrumb) for monitoring.
   - Handle loading/error states gracefully (hide CTA and show neutral text when streak is unknown or fetch fails).

3) **Route-level guard**
   - Add a guard component on `/cat-generator` that checks streak (client-side via `useUserDbData` with a loading spinner) and redirects back to `/thank-you` with a friendly message when the streak is below the access threshold.
   - Provide an allowlist/override (env list of emails) for admins/testers during rollout.

4) **Incremental feature unlocks inside the cat generator**
   - Phase A (>= access threshold): show a generated cat but lock the form controls (read-only preview).
   - Phase B (>= `CAT_GEN_CUSTOMIZE_STREAK`): unlock the full customization controls.
   - Phase C (>= `CAT_GEN_EXPORT_STREAK`): enable “Export SVG”.
   - Phase D (>= `CAT_GEN_RARE_TRAITS_STREAK`): reveal rare palettes/traits (can be flag-driven).
   - Visually communicate locked items (disabled buttons with tooltip explaining required streak).

5) **Rollout & QA**
   - Start disabled in production; enable for a small allowlist, then raise to everyone once metrics look healthy.
   - Automated checks: unit tests for the gating helper and CTA visibility given mock streak values; integration test to assert `/cat-generator` redirects when streak is too low.
   - Manual checks: login states with streak 0/1/3/5/10; CTA rendering, redirect behavior, locked controls, and export availability; confirm fallback when Supabase is unavailable.

6) **Open questions**
   - Confirm target streak thresholds and whether downloads should be a later phase.
   - Decide where to store telemetry (Supabase vs. Sentry) and retention expectations.
   - Should admins always bypass gating for demos?
