-- Spusť v Supabase SQL Editor (nebo migracemi). Slouží k jednotným datům napříč doménami.

create table if not exists baseline_profiles (
  user_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists body_measurement_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists body_measurement_entries_user_id_idx on body_measurement_entries (user_id);

alter table baseline_profiles enable row level security;
alter table body_measurement_entries enable row level security;

drop policy if exists "baseline select" on baseline_profiles;
create policy "baseline select" on baseline_profiles for select to anon using (true);
drop policy if exists "baseline insert" on baseline_profiles;
create policy "baseline insert" on baseline_profiles for insert to anon with check (true);
drop policy if exists "baseline update" on baseline_profiles;
create policy "baseline update" on baseline_profiles for update to anon using (true) with check (true);

drop policy if exists "bodym select" on body_measurement_entries;
create policy "bodym select" on body_measurement_entries for select to anon using (true);
drop policy if exists "bodym insert" on body_measurement_entries;
create policy "bodym insert" on body_measurement_entries for insert to anon with check (true);
drop policy if exists "bodym delete" on body_measurement_entries;
create policy "bodym delete" on body_measurement_entries for delete to anon using (true);
