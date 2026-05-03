-- ============================================================
-- Cache de metadata de Perenual por especie.
--
-- Tabla compartida entre todos los usuarios: la primera vez que
-- alguien escanea una Monstera, la edge function `plant-metadata`
-- llama a Perenual y persiste el resultado aquí. Para escaneos
-- futuros de la misma especie servimos directo desde Postgres y
-- evitamos consumir el cuota gratis de Perenual (100 req/día).
--
-- La key es scientific_name normalizado (lowercase + trim) para
-- que "Monstera deliciosa", "monstera deliciosa", " Monstera
-- Deliciosa " resuelvan al mismo registro.
-- ============================================================

create table if not exists public.plant_metadata (
  scientific_name text primary key,
  perenual_id integer,
  common_name text,
  family text,
  type text,
  cycle text,
  watering text,
  watering_benchmark_value text,
  watering_benchmark_unit text,
  sunlight text[],
  origin text[],
  raw jsonb not null,
  source text not null default 'perenual',
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plant_metadata_perenual_id_idx
  on public.plant_metadata (perenual_id);

-- RLS: cualquier usuario autenticado puede LEER el cache (es data
-- compartida, no contiene info personal). Las escrituras solo las
-- hace la edge function vía service-role, así que no exponemos
-- ningún policy de insert/update/delete a los clientes.
alter table public.plant_metadata enable row level security;

drop policy if exists "Authenticated users can read plant metadata"
  on public.plant_metadata;
create policy "Authenticated users can read plant metadata"
on public.plant_metadata for select
to authenticated
using (true);

-- Trigger para mantener updated_at sincronizado.
create or replace function public.set_plant_metadata_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists plant_metadata_set_updated_at
  on public.plant_metadata;
create trigger plant_metadata_set_updated_at
before update on public.plant_metadata
for each row
execute function public.set_plant_metadata_updated_at();
