create table if not exists study_documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  block text not null,
  title text not null,
  note text not null default '',
  file_name text not null,
  mime_type text not null,
  data_url text not null,
  file_size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists study_documents_user_id_idx on study_documents (user_id);
create index if not exists study_documents_created_at_idx on study_documents (created_at desc);

alter table study_documents enable row level security;

drop policy if exists "study docs select" on study_documents;
create policy "study docs select" on study_documents for select to anon using (true);
drop policy if exists "study docs insert" on study_documents;
create policy "study docs insert" on study_documents for insert to anon with check (true);
drop policy if exists "study docs delete" on study_documents;
create policy "study docs delete" on study_documents for delete to anon using (true);

