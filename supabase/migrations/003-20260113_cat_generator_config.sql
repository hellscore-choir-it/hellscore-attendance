-- Cat generator rollout config table (single-row)
create table if not exists public.cat_generator_config (
  id uuid primary key default gen_random_uuid(),
  rollout_paused boolean not null default false,
  access_streak integer not null default 2,
  customize_streak integer not null default 4,
  export_streak integer not null default 5,
  rare_traits_streak integer not null default 7,
  allowlist text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Ensure only a single row is present (use the same ID on upsert).
insert into public.cat_generator_config (
  id,
  rollout_paused,
  access_streak,
  customize_streak,
  export_streak,
  rare_traits_streak,
  allowlist
)
values (
  '00000000-0000-0000-0000-000000000000',
  false,
  2,
  4,
  5,
  7,
  array['vehpus@gmail.com', 'hellscorechoir.it@gmail.com']
)
on conflict (id) do update set
  rollout_paused = excluded.rollout_paused,
  access_streak = excluded.access_streak,
  customize_streak = excluded.customize_streak,
  export_streak = excluded.export_streak,
  rare_traits_streak = excluded.rare_traits_streak,
  allowlist = excluded.allowlist,
  updated_at = now();

