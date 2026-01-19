-- App config table (key -> jsonb value)
--
-- App-controlled schema: keys are stable, values are JSON.
-- This enables adding/removing config entries without schema migrations.
create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Seed defaults (idempotent)
insert into public.app_config (key, value)
values
  ('catGenerator.rolloutPaused', 'false'::jsonb),
  ('catGenerator.accessStreak', '2'::jsonb),
  ('catGenerator.customizeStreak', '4'::jsonb),
  ('catGenerator.exportStreak', '5'::jsonb),
  ('catGenerator.rareTraitsStreak', '7'::jsonb),
  ('catGenerator.allowlist', '["vehpus@gmail.com","hellscorechoir.it@gmail.com"]'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

