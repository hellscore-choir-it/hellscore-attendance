-- In-app telemetry dashboard allowlist (separate from cat-generator access allowlist)
--
-- The app uses this list to gate access to `/telemetry/cat-generator` and its API.
-- Values are JSON (jsonb) like the rest of `public.app_config`.

insert into public.app_config (key, value)
values
  (
    'telemetry.allowlist',
    '["vehpus@gmail.com","hellscorechoir.it@gmail.com"]'::jsonb
  )
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
