create table if not exists public.user (
  id character varying not null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  modified_at timestamp with time zone null,
  data jsonb null,
  constraint user_pkey primary key (id)
) TABLESPACE pg_default;