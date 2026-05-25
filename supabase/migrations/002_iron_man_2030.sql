-- Iron Man 2030 modul: stav modulu (kalendář, otužování, meditace, registrace závodů)
-- + rozšíření training_sessions o tag projektu

create table if not exists iron_man_2030_state (
  user_id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table iron_man_2030_state enable row level security;

drop policy if exists "iron select" on iron_man_2030_state;
create policy "iron select" on iron_man_2030_state for select to anon using (true);
drop policy if exists "iron insert" on iron_man_2030_state;
create policy "iron insert" on iron_man_2030_state for insert to anon with check (true);
drop policy if exists "iron update" on iron_man_2030_state;
create policy "iron update" on iron_man_2030_state for update to anon using (true) with check (true);

-- Sloupce na tréninkovém deníku (tabulka už může existovat z README)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'training_sessions'
  ) then
    alter table training_sessions add column if not exists iron_man_2030_project boolean not null default false;
    alter table training_sessions add column if not exists iron_man_discipline text;
  end if;
end $$;
