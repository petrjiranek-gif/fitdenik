## FitDenik

Moderni ceska web aplikace pro trenink, vyzivu, benchmarky a progress tracking.

Produkce: [fitdenik.ewattup.com](https://fitdenik.ewattup.com) — alias `fitdenik.vercel.app` přesměruje na kanonickou doménu (middleware). Repo: `petrjiranek-gif/fitdenik`.

Na Vercelu nastav `NEXT_PUBLIC_APP_URL=https://fitdenik.ewattup.com` (Production). Volitelně `NEXT_PUBLIC_VERCEL_PROJECT_HOST=fitdenik.vercel.app` pokud by se změnil slug projektu.

Přenos dat mezi doménami (stejný build, jiný `localStorage`): stránka **Importy** → sekce záloha JSON (export na staré adrese, import na `fitdenik.ewattup.com`).

## Getting Started

Spusteni lokalne:

```bash
npm run dev
```

Otevri [http://localhost:3000](http://localhost:3000).

## Repository provider

```bash
# výchozí — data jen v prohlížeči (localStorage), jiné na každé doméně
NEXT_PUBLIC_FITDENIK_REPOSITORY=localStorage

# produkce — tréninky, výživa, benchmarky, baseline, měření těla přes Supabase (stejné všude)
NEXT_PUBLIC_FITDENIK_REPOSITORY=supabase
```

Volitelně jednotný „uživatel“ pro řádky v DB (výchozí `u1`):

```bash
NEXT_PUBLIC_FITDENIK_USER_ID=u1
```

Nové tabulky pro baseline a měření těla: spusť SQL ze souboru `supabase/migrations/001_baseline_body_measurements.sql` v Supabase SQL Editoru (po tabulkách z training/nutrition/benchmark výše).

## Supabase minimal setup (training API)

Pro prvni live endpoint nastav:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Minimalni SQL tabulka pro `GET/POST /api/training`:

```sql
create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  sport_type text not null,
  title text not null,
  duration_min int not null,
  distance_km numeric not null default 0,
  avg_heart_rate int not null default 0,
  calories int not null default 0,
  elevation int not null default 0,
  pace text not null default '-',
  effort text not null default 'stredni',
  rpe int not null default 0,
  notes text not null default ''
);
```

RLS policy pro `training_sessions`:

```sql
alter table training_sessions enable row level security;

drop policy if exists "allow read training_sessions" on training_sessions;
create policy "allow read training_sessions"
on training_sessions
for select
to anon
using (true);

drop policy if exists "allow insert training_sessions" on training_sessions;
create policy "allow insert training_sessions"
on training_sessions
for insert
to anon
with check (true);

drop policy if exists "allow delete training_sessions" on training_sessions;
create policy "allow delete training_sessions"
on training_sessions
for delete
to anon
using (true);
```

## Supabase nutrition setup (nutrition API)

Minimalni SQL tabulka pro `GET/POST /api/nutrition`:

```sql
create table if not exists nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  calories int not null default 0,
  protein int not null default 0,
  carbs int not null default 0,
  fat int not null default 0,
  fiber int not null default 0,
  water_liters numeric not null default 0,
  body_weight_kg numeric not null default 0,
  notes text not null default ''
);
```

RLS policy pro `nutrition_entries`:

```sql
alter table nutrition_entries enable row level security;

drop policy if exists "allow read nutrition_entries" on nutrition_entries;
create policy "allow read nutrition_entries"
on nutrition_entries
for select
to anon
using (true);

drop policy if exists "allow insert nutrition_entries" on nutrition_entries;
create policy "allow insert nutrition_entries"
on nutrition_entries
for insert
to anon
with check (true);
```

## Supabase benchmark setup (benchmarks API)

Minimalni SQL tabulka pro `GET/POST /api/benchmarks`:

```sql
create table if not exists benchmark_results (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  benchmark_name text not null,
  result_type text not null,
  result_value text not null,
  scaling text not null default '',
  notes text not null default '',
  source_type text not null default 'wodwell',
  source_name text not null default 'WODwell',
  source_url text not null default ''
);
```

RLS policy pro `benchmark_results`:

```sql
alter table benchmark_results enable row level security;

drop policy if exists "allow read benchmark_results" on benchmark_results;
create policy "allow read benchmark_results"
on benchmark_results
for select
to anon
using (true);

drop policy if exists "allow insert benchmark_results" on benchmark_results;
create policy "allow insert benchmark_results"
on benchmark_results
for insert
to anon
with check (true);
```

## Supabase dashboard summary (dashboard API)

Endpoint `GET /api/dashboard-summary` nevyzaduje dalsi tabulky navic.
Pouziva uz vytvorene:
- `training_sessions`
- `nutrition_entries`
- `benchmark_results`

Na dashboardu pak karty zobrazuji live agregace za poslednich 7 dni:
- pocet treninku
- aktivni cas
- treningove kalorie
- prumer bilkovin
- posledni benchmark

## Supabase imports setup (imports API)

Minimalni SQL tabulka pro `GET/POST /api/imports`:

```sql
create table if not exists screenshot_imports (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  created_at timestamp with time zone not null default now(),
  source_app text not null,
  image_name text not null default '',
  import_target text not null check (import_target in ('training', 'nutrition')),
  parsed_json jsonb not null default '{}'::jsonb,
  status text not null default 'saved'
);
```

RLS policy pro `screenshot_imports`:

```sql
alter table screenshot_imports enable row level security;

drop policy if exists "allow read screenshot_imports" on screenshot_imports;
create policy "allow read screenshot_imports"
on screenshot_imports
for select
to anon
using (true);

drop policy if exists "allow insert screenshot_imports" on screenshot_imports;
create policy "allow insert screenshot_imports"
on screenshot_imports
for insert
to anon
with check (true);

drop policy if exists "allow delete screenshot_imports" on screenshot_imports;
create policy "allow delete screenshot_imports"
on screenshot_imports
for delete
to anon
using (true);
```

Bez politiky `for delete` mazání z aplikace projde bez chyby v Supabase klientovi, ale v databázi se nesmaže žádný řádek (RLS) — po obnovení stránky se záznamy znovu objeví.

## Build checks

```bash
npm run lint
npm run build
```

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
