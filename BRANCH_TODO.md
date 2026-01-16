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

### 0.5) Supabase schema migrations pipeline (prerequisite for applying new migrations)

- [x] Decide and document the migration mechanism.
  - Completion criteria: repo has a single “source of truth” for schema changes (SQL files under `supabase/migrations/`), and contributors know how to apply them locally + remotely.
  - Decision (this branch): use Supabase CLI migrations as the runner
- [x] Add a migration correctness test that runs locally + in CI (no production DB access).
  - Completion criteria: on every PR/branch, CI provisions an ephemeral database and applies all migrations successfully, failing if any migration is invalid.
  - Local dev command (implemented): `pnpm db:migrations:check` (uses Docker + Postgres container).
  - CI approach (implemented): plain Postgres service container
    - Start `postgres:16` as a GitHub Actions service.
    - Run the same migration check script with `DATABASE_URL` set.
    - Note: this validates SQL correctness + ordering; it does not exercise Supabase’s full local stack.
  - Optional future upgrade: run against the Supabase local emulator (`supabase start` + `supabase db reset`) to get closer fidelity.
  - Notes: this is the main safety net on the free tier (no staging/preview DB required).
- [x] Add a PR merge gate: block merging if the branch is missing newer migrations from the PR base branch.
  - Completion criteria: PR checks fail when the base branch contains migration files under `supabase/migrations/` that are not present in the PR branch (forces rebase/merge from base branch before landing).
  - Intended behavior: prevents “migration drift” where two branches both add migrations, and the later-merged branch accidentally runs with an out-of-date view of the migration sequence.
  - Concrete check (example logic):
    - Fetch PR base branch (CI uses the PR base ref; local can use your default branch).
    - Compare the set of migration filenames on the base branch vs `HEAD`.
- [x] Add CI automation to apply migrations to the production Supabase project on push to the default branch (`master`/`main`).
  - Completion criteria: a GitHub Action runs automatically on `push` to the default branch and applies pending migrations to production using secrets.
  - Constraint: PR checks must not use production credentials.
  - Concrete approach (Supabase CLI):
    - Store GitHub Actions secret: `SUPABASE_DB_URL`.
    - In the workflow: `npx supabase@latest --yes db push --db-url "$SUPABASE_DB_URL"`.
    - Ensure it runs only on `push` to the default branch.
- [ ] Apply pending migrations (`003` and `004`) to the production DB via the default-branch-only pipeline.
  - Completion criteria: the `public.cat_generator_config` table + seed row exist in production, and the app reads config values from Supabase without falling back to defaults.

### 1) Config + foundations

- [x] Add Supabase config table(s) for the decided thresholds, rollout pause toggle, and admin allowlist. Move existing hardcoded / environment variable controlled constants to use this table. (Scaffolding added in `catGeneratorConfig.ts` to read the table with defaults; actual table provisioning still needed.)
  - Completion criteria: a dedicated table exists in Supabase; defaults match the Decisions section; rollout pause can disable all cat-generator gating/CTAs; admin emails are sourced from Supabase (not env vars).
- [x] Create a single helper for reading streak + eligibility safely. (Implemented `computeCatGeneratorEligibility` with defaults + tests.)
  - Completion criteria: helper handles loading/error/null; returns a normalized streak number + feature unlock booleans; unit tests cover edge cases.

### 2) Telemetry + dashboard (Supabase)

- [x] Add Supabase telemetry table(s) + minimal write path for events (impression/click).
  - Completion criteria: telemetry stores only anonymized user IDs (no raw email); schema documented; unit tests cover anonymization helper usage.
- [ ] Add a Supabase dashboard specification (and/or saved chart definitions if supported in repo process).
  - Completion criteria: dashboard tracks impressions/clicks over time and can be segmented by event type; includes a view that helps correlate to attendance response rates.

### 3) Thank-you page CTA (entry point)

- [x] Add CTA to `/thank-you` (and only there) gated by `CAT_GEN_ACCESS_STREAK`.
  - Completion criteria: when eligible, CTA links to `/cat-generator`; when ineligible, show “X more reports to unlock cats” once streak is known.
- [x] Log CTA impression + click events.
  - Completion criteria: telemetry events fire exactly once per page view for impression (no spam on rerender) and once per click.
- [x] Add tests for CTA visibility + copy + telemetry behavior.
  - Completion criteria: tests cover eligible/ineligible/loading/error states; telemetry write mocked only at the boundary.

### 4) Route-level guard on `/cat-generator`

- [x] Add a client-side guard that enforces `CAT_GEN_ACCESS_STREAK`.
  - Completion criteria: below threshold redirects back to `/thank-you` with a friendly message; above threshold loads page normally; shows a loading state while streak is unknown. (Redirect + loading state implemented.)
- [x] Add Supabase-based admin bypass check.
  - Completion criteria: allowlisted emails bypass gating (even when kill switch is on); list is sourced from Supabase; no raw email stored in telemetry.
- [x] Add tests for guard redirect + allowlist bypass.
  - Completion criteria: deterministic tests cover below/above threshold + allowlist.
- [x] Translate cat generator page texts into Hebrew.
  - Completion criteria: all user-facing strings on `/cat-generator` are localized to Hebrew, consistent with other pages.
- [x] Add basic UI test coverage for cat generator controls.
  - Completion criteria: tests assert controls render and update preview state; ideally established before further gating changes to ensure stability.

### 5) Incremental feature unlocks inside cat generator

- [x] Phase A (>= access): show generated cat preview but lock customization controls.
  - Completion criteria: controls are disabled/read-only; UI communicates why and required streak.
- [x] Phase B (>= customize): unlock customization controls.
  - Completion criteria: controls become interactive; tests cover locked vs unlocked behavior.
- [x] Phase C (>= export): enable SVG export (and optionally simple PNG/JPEG/copy support).
  - Completion criteria: export UI is disabled below threshold; export works above threshold; tests cover gating and output generation for SVG.
- [x] Phase D (>= rare traits): unlock rare palettes/traits.
  - Completion criteria: rare options are hidden/disabled below threshold; enabled above; tests cover unlock behavior.
- [x] Update `thank-you` to reflect unlocked features as streak increases, and which milestone is next.
  - Completion criteria: dynamic messaging shows current unlocks and next milestone; tests cover messaging logic.

### 6) Browser testing (optional Cypress CT, minimal Playwright E2E)

- [ ] Decide whether to add Cypress Component Testing (CT).

  - Completion criteria: we have a documented approach that works reliably in CI.
  - If CT integration is brittle in this Next/Vercel setup: skip CT and keep Jest-only + minimal E2E smoke.

- [ ] If we do CT: add Cypress and wire scripts.
  - Completion criteria: `pnpm cypress:open` and `pnpm cypress:run` work locally; CI can run `cypress:run` headlessly.
  - Notes: keep tests stable/deterministic; avoid relying on real Google/Supabase/network.

#### Step 6 guiding principles (recommended)

- Jest remains the primary safety net for logic and most component behavior.
- Cypress CT should be used sparingly for areas where a real browser catches issues that JSDOM/Jest might miss (Radix interactions, focus/keyboard, pointer behavior, RTL direction quirks).
- E2E tests should be a minimal smoke layer (high ROI, low flake), and must avoid real Google auth and real production data.

#### 6.A) Component test plan (do this before E2E)

- [ ] If we do CT: decide Cypress Component Testing (CT) strategy for Next.js 16 + React 19.

  - Completion criteria: we have a documented approach that works reliably in CI.
  - Intended approach (preferred): Cypress Component Testing with the React adapter (bundler TBD) + explicit provider wrappers.
  - Recommendation: do CT only for the smallest set of browser-sensitive interactions; do not try to re-test everything already covered by Jest.

- [ ] If we do CT: create a single `mountWithProviders` helper for Cypress CT.

  - Completion criteria: components can be mounted with consistent defaults and minimal per-test boilerplate.
  - Wrapper responsibilities:
    - React Query `QueryClientProvider` with fresh client per test
    - Session wrapper (NextAuth) that can set session state to logged-in / logged-out
    - Router mock / stubs for `push`/`replace`
    - Toast stubs (Sonner/Notistack) so tests assert “toast called” without rendering toasts

- [ ] If we do CT: define the minimum deterministic CT coverage (no network).

  - Completion criteria: tests cover the following interaction surfaces without flaking:
    - `CatGenerator` (highest ROI): can change selects/sliders and updates preview props; RTL sliders increase right→left; rare palettes hidden/shown by prop
    - Optional (only if value is proven): `AttendanceForm` basic interaction smoke in real browser (still no real TRPC/network)
    - Optional (likely redundant): `StreakTracker` unless we see browser-only behavior or CSS/layout direction issues
  - Notes:
    - Mock TRPC at the boundary: intercept calls or stub the hook layer; do not hit real backend.
    - Prefer `data-testid` for brittle UI controls (Radix selects/sliders) if needed to avoid label-text coupling.

- [ ] If we do CT: add CT specs to CI.
  - Completion criteria: CT specs run headlessly in CI and are deterministic.

#### 6.B) E2E tests (minimal smoke)

- [ ] Add Playwright E2E smoke tests for the major pages (preferred over Cypress for E2E).

  - Completion criteria: basic smoke tests assert page loads + key UI is present for:
    - `/` (attendance form renders)
    - `/thank-you` (streak tracker + CTA state)
    - `/cat-generator` (guard behavior + core UI)
    - `/catalog` and `/cat-generator` if they’re considered “major” in this rollout
  - Notes:
    - Keep E2E scope minimal (smoke + 1–2 critical flows).
    - Rationale: Playwright is typically easier to run in CI for Next.js/Vercel apps, has strong multi-browser support, and tends to be less brittle for navigation/network orchestration.
    - Prefer a mocked auth/session approach (test-only cookie/header or test helper gated to test mode) rather than real NextAuth/Google.
    - Avoid using real Supabase/Google/network in E2E; use stubs/mocks or test fixtures.

- [ ] When we adopt Playwright for E2E, wire Playwright scripts in `package.json`.
  - Completion criteria: `pnpm pw:install`, `pnpm pw:test`, and optional `pnpm pw:ui` work locally; CI runs `pw:test` headlessly.

### 7) Rollout controls + QA

- [ ] Start disabled in production via kill switch; enable for allowlist first.
  - Completion criteria: kill switch off prevents CTA + route access for non-allowlist; allowlist bypass still works for testing.
- [ ] Manual QA sweep across streak values (0/1/2/4/5/7+) and auth states.
  - Completion criteria: CTA logic and redirects behave correctly; export is gated; telemetry appears in Supabase.
- [ ] Review telemetry/dashboard after rollout enablement.
  - Completion criteria: impressions/clicks increase as expected; no PII stored; dashboard usable for engagement monitoring.
