-- Telemetry for cat-generator rollout (impressions/clicks)

create table if not exists public.cat_generator_telemetry (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text not null,
  event_name text not null,
  page text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists cat_generator_telemetry_created_at_idx
  on public.cat_generator_telemetry (created_at);

create index if not exists cat_generator_telemetry_event_name_idx
  on public.cat_generator_telemetry (event_name);

create index if not exists cat_generator_telemetry_user_id_idx
  on public.cat_generator_telemetry (user_id);
