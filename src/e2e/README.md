# E2E Test Helpers

This folder contains Playwright-only helpers/fixtures to keep E2E concerns out of production logic.

## How it works

- `E2E_TEST_MODE=true` (server) + `NEXT_PUBLIC_E2E_TEST_MODE=true` (client) enable E2E fixtures.
- Auth is simulated via `?e2eEmail=`.
- Streak can be set via `?e2eStreak=` (number) or `?e2eStreak=loading`.

## Why this exists

The real app depends on Google + Supabase + NextAuth. For deterministic browser smoke tests we avoid real network auth and provide lightweight fixtures.
