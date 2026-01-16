# Cat Generator Telemetry — Supabase Dashboard Spec

This doc defines a minimal set of Supabase dashboard charts/queries to monitor the cat-generator rollout CTA and usage.

## Data sources

- `public.cat_generator_telemetry`

  - `created_at` (timestamptz)
  - `user_id` (text) — anonymized (SHA-256 hash of email)
  - `event_name` (text) — currently: `cta_impression`, `cta_click`
  - `page` (text) — currently: `thank-you`
  - `metadata` (jsonb) — currently `{}`

- `public.app_config`

  - KV entries for cat generator are stored under `catGenerator.*` keys (jsonb values)
  - Required keys:
    - `catGenerator.rolloutPaused` (boolean)
    - `catGenerator.accessStreak` (number)
    - `catGenerator.customizeStreak` (number)
    - `catGenerator.exportStreak` (number)
    - `catGenerator.rareTraitsStreak` (number)
    - `catGenerator.allowlist` (string[])

- `public.user`
  - `id` (text) — same anonymized user id scheme as `cat_generator_telemetry.user_id`
  - `data` (jsonb) — includes `responseStreak`, `maxStreak`, etc.

## Recommended charts

### 1) Events over time (impressions vs clicks)

Line chart:

```sql
select
  date_trunc('day', created_at) as day,
  event_name,
  count(*) as events
from public.cat_generator_telemetry
where page = 'thank-you'
group by 1, 2
order by 1 asc, 2 asc;
```

### 2) Unique users per day

Line chart:

```sql
select
  date_trunc('day', created_at) as day,
  event_name,
  count(distinct user_id) as unique_users
from public.cat_generator_telemetry
where page = 'thank-you'
group by 1, 2
order by 1 asc, 2 asc;
```

### 3) Daily CTA click-through rate (CTR)

Line chart:

```sql
select
  date_trunc('day', created_at) as day,
  count(*) filter (where event_name = 'cta_impression') as impressions,
  count(*) filter (where event_name = 'cta_click') as clicks,
  case
    when count(*) filter (where event_name = 'cta_impression') = 0 then 0
    else
      (count(*) filter (where event_name = 'cta_click'))::float
      / (count(*) filter (where event_name = 'cta_impression'))::float
  end as ctr
from public.cat_generator_telemetry
where page = 'thank-you'
group by 1
order by 1 asc;
```

### 4) Funnel: users who saw CTA and clicked (same day)

Bar chart (or table):

```sql
with per_user_day as (
  select
    date_trunc('day', created_at) as day,
    user_id,
    bool_or(event_name = 'cta_impression') as saw_cta,
    bool_or(event_name = 'cta_click') as clicked_cta
  from public.cat_generator_telemetry
  where page = 'thank-you'
  group by 1, 2
)
select
  day,
  count(*) filter (where saw_cta) as users_saw_cta,
  count(*) filter (where saw_cta and clicked_cta) as users_clicked_cta,
  case
    when count(*) filter (where saw_cta) = 0 then 0
    else
      (count(*) filter (where saw_cta and clicked_cta))::float
      / (count(*) filter (where saw_cta))::float
  end as user_level_ctr
from per_user_day
group by 1
order by 1 asc;
```

### 5) Adoption by user streak (approximate)

Note: telemetry currently does **not** store the streak at the time of the event, so this uses the **current** `public.user.data.responseStreak` as a proxy.

Table:

```sql
select
  t.event_name,
  coalesce((u.data->>'responseStreak')::int, 0) as response_streak,
  count(*) as events,
  count(distinct t.user_id) as unique_users
from public.cat_generator_telemetry t
left join public.user u on u.id = t.user_id
where t.page = 'thank-you'
group by 1, 2
order by 1 asc, 2 asc;
```

### 6) Eligibility vs usage snapshot

Table:

```sql
with cfg as (
  select (value::text)::int as access_streak
  from public.app_config
  where key = 'catGenerator.accessStreak'
),
eligible_users as (
  select count(*) as eligible
  from public.user, cfg
  where coalesce((data->>'responseStreak')::int, 0) >= cfg.access_streak
),
cta_users_7d as (
  select count(distinct user_id) as engaged
  from public.cat_generator_telemetry
  where created_at >= now() - interval '7 days'
    and event_name = 'cta_click'
    and page = 'thank-you'
)
select
  eligible_users.eligible as eligible_users_current,
  cta_users_7d.engaged as users_clicked_cta_last_7d
from eligible_users
cross join cta_users_7d;
```

## Suggested dashboard layout

- Top row: (1) Events over time, (3) Daily CTR
- Middle row: (2) Unique users per day, (4) Funnel (user-level CTR)
- Bottom row: (5) Adoption by streak, (6) Eligibility vs usage snapshot
