-- ============================================================
-- Cache compartido de metadata de plantas generada por Claude.
--
-- Cuando un usuario escanea una especie nueva, la edge function
-- `plant-metadata` consulta primero esta tabla. Si no hay hit,
-- llama a Claude Haiku con un tool schema estructurado, persiste
-- el resultado y lo devuelve. De ahí en adelante, cualquier otro
-- usuario que escanee la misma especie obtiene la metadata sin
-- gastar tokens del LLM.
--
-- La PK es `scientific_name` normalizado (lowercase + collapse de
-- espacios) — eso garantiza que "Monstera deliciosa", "monstera
-- deliciosa" y "  Monstera Deliciosa  " resuelvan al mismo row.
--
-- Esta migration es idempotente: no borra ni recrea el contenido
-- existente, solo asegura que el schema sea el correcto.
-- ============================================================

create table if not exists public.plant_metadata (
  scientific_name text primary key,
  common_name text,
  origin text,
  light text check (light in ('directa', 'indirecta')),
  watering_level text check (watering_level in ('alto', 'medio', 'bajo')),
  watering_freq_days integer check (watering_freq_days between 1 and 60),
  raw jsonb not null,
  source text not null default 'haiku',
  model text,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: cualquier usuario autenticado puede LEER el cache (no hay
-- info personal, es contenido compartido). Las escrituras solo las
-- hace la edge function vía service-role, así que no exponemos
-- ninguna policy de insert/update/delete a clientes.
alter table public.plant_metadata enable row level security;

drop policy if exists "Authenticated users can read plant metadata"
  on public.plant_metadata;
create policy "Authenticated users can read plant metadata"
  on public.plant_metadata for select
  to authenticated
  using (true);

-- Trigger para mantener updated_at sincronizado en cada update.
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
