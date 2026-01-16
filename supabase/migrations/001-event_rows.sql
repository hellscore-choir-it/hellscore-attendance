create table if not exists public.event (
  id character varying not null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  modified_at timestamp without time zone null,
  data jsonb null,
  constraint event_pkey primary key (id)
) TABLESPACE pg_default;