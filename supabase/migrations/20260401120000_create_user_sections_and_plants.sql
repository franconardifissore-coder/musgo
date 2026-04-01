create table if not exists public.sections (
  id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '🪴',
  outdoor boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sections add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.sections add column if not exists name text;
alter table public.sections add column if not exists icon text default '🪴';
alter table public.sections add column if not exists outdoor boolean default false;
alter table public.sections add column if not exists created_at timestamptz default now();
alter table public.sections add column if not exists updated_at timestamptz default now();

update public.sections
set
  name = coalesce(name, 'Sección'),
  icon = coalesce(icon, '🪴'),
  outdoor = coalesce(outdoor, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.sections alter column name set not null;
alter table public.sections alter column icon set not null;
alter table public.sections alter column outdoor set not null;
alter table public.sections alter column created_at set not null;
alter table public.sections alter column updated_at set not null;
alter table public.sections alter column icon set default '🪴';
alter table public.sections alter column outdoor set default false;
alter table public.sections alter column created_at set default now();
alter table public.sections alter column updated_at set default now();

create table if not exists public.plants (
  id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  species text,
  emoji text not null default '🌿',
  section_id text references public.sections (id) on delete cascade,
  freq integer not null default 3,
  light text not null default '⛅ Luz indirecta',
  water_log jsonb not null default '[]'::jsonb,
  image_preview text,
  identified_species text,
  identification_confidence numeric,
  identified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plants add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.plants add column if not exists name text;
alter table public.plants add column if not exists species text;
alter table public.plants add column if not exists emoji text default '🌿';
alter table public.plants add column if not exists section_id text references public.sections (id) on delete cascade;
alter table public.plants add column if not exists freq integer default 3;
alter table public.plants add column if not exists light text default '⛅ Luz indirecta';
alter table public.plants add column if not exists water_log jsonb default '[]'::jsonb;
alter table public.plants add column if not exists image_preview text;
alter table public.plants add column if not exists identified_species text;
alter table public.plants add column if not exists identification_confidence numeric;
alter table public.plants add column if not exists identified_at timestamptz;
alter table public.plants add column if not exists created_at timestamptz default now();
alter table public.plants add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'plants'
      and column_name = 'section'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'plants'
      and column_name = 'section_id'
  ) then
    alter table public.plants rename column section to section_id;
  end if;
end $$;

update public.plants
set
  name = coalesce(name, 'Planta'),
  emoji = coalesce(emoji, '🌿'),
  freq = coalesce(freq, 3),
  light = coalesce(light, '⛅ Luz indirecta'),
  water_log = coalesce(water_log, '[]'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.plants alter column name set not null;
alter table public.plants alter column emoji set not null;
alter table public.plants alter column freq set not null;
alter table public.plants alter column light set not null;
alter table public.plants alter column water_log set not null;
alter table public.plants alter column created_at set not null;
alter table public.plants alter column updated_at set not null;
alter table public.plants alter column emoji set default '🌿';
alter table public.plants alter column freq set default 3;
alter table public.plants alter column light set default '⛅ Luz indirecta';
alter table public.plants alter column water_log set default '[]'::jsonb;
alter table public.plants alter column created_at set default now();
alter table public.plants alter column updated_at set default now();

create index if not exists sections_user_id_idx on public.sections (user_id);
create index if not exists plants_user_id_idx on public.plants (user_id);
create index if not exists plants_section_id_idx on public.plants (section_id);

alter table public.sections enable row level security;
alter table public.plants enable row level security;

drop policy if exists "Users can read own sections" on public.sections;
create policy "Users can read own sections"
on public.sections for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own sections" on public.sections;
create policy "Users can insert own sections"
on public.sections for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own sections" on public.sections;
create policy "Users can update own sections"
on public.sections for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sections" on public.sections;
create policy "Users can delete own sections"
on public.sections for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own plants" on public.plants;
create policy "Users can read own plants"
on public.plants for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own plants" on public.plants;
create policy "Users can insert own plants"
on public.plants for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own plants" on public.plants;
create policy "Users can update own plants"
on public.plants for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own plants" on public.plants;
create policy "Users can delete own plants"
on public.plants for delete
using (auth.uid() = user_id);
