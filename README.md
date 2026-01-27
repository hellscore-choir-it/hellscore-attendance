# Hellscore Attendance

This is a web app for tracking attendance of [Hellscore](https://www.youtube.com/hellscoreacappella) members. It integrates with google calendar in order to get event data, and google sheets as a database.

It can be viewed [Here](https://hellscore-attendance.vercel.app/)

## Google Sheets data mapping

The attendance data source of truth lives in Google Sheets. These A1 ranges are used for reading attendance data:

- Users!A1:B (Email, Name)
- Responses!A1:J (User Email, Timestamp millis, Event Title, Event Date, Going?, Why Not?, Went Last Time?, Comments, Row Key, Is Last Submission)

## Database & migrations (Supabase)

This repo stores Postgres schema changes as SQL migrations in `supabase/migrations/`. These are intended to be applied in order (e.g. `001-...sql`, `002-...sql`, etc).

### Quick migration correctness check (local + CI)

Run:

```bash
pnpm db:migrations:check
```

This applies every `supabase/migrations/*.sql` file in sorted order against a temporary Postgres database and performs a couple of sanity checks.

Local run requirements:

- **Docker Desktop installed** (required)
  - The script will spin up an ephemeral `postgres:16` container and run migrations inside it.

If you prefer a **persistent local Docker Postgres** (closer to how CI runs), you can:

```bash
pnpm db:local:up
eval "$(pnpm -s db:local:url)"
pnpm db:migrations:check
```

When you’re done:

```bash
pnpm db:local:down
```

In CI, the workflow uses a Postgres service + `psql` and does not touch production.

### Full local Supabase stack (optional)

If you want a closer-to-production local environment (Supabase services + Postgres), use the Supabase CLI.

Prereqs:

- Docker Desktop (Supabase CLI starts local containers)

Example workflow:

```bash
# Start local Supabase services
supabase start

# Reset local DB and apply migrations from supabase/migrations/
supabase db reset

# Show local URLs/ports (see output for the DB URL)
supabase status
```

Note: for day-to-day local development, `supabase db reset` is the simplest way to apply migrations to your local Supabase DB.

### GitHub Actions behavior

- On pull requests, the repo runs a migration check against a throwaway Postgres DB and also blocks merging if your branch is missing any migration files already present on `main`.
- On pushes to `main`, the workflow applies migrations to the production Supabase database using the `SUPABASE_DB_URL` GitHub secret.
