-- HRV záznamy pro AI trenéra a Iron Man 2030 (ms, zdroj Apple Watch / jiná app / ručně).

create table if not exists hrv_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists hrv_entries_user_id_idx on hrv_entries (user_id);
create index if not exists hrv_entries_created_at_idx on hrv_entries (created_at desc);

alter table hrv_entries enable row level security;

drop policy if exists "hrv select" on hrv_entries;
create policy "hrv select" on hrv_entries for select to anon using (true);
drop policy if exists "hrv insert" on hrv_entries;
create policy "hrv insert" on hrv_entries for insert to anon with check (true);
drop policy if exists "hrv delete" on hrv_entries;
create policy "hrv delete" on hrv_entries for delete to anon using (true);
