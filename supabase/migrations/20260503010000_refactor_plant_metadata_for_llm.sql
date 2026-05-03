-- ============================================================
-- Pivot: la metadata se genera con Claude Haiku (no Perenual).
--
-- El plan free de Perenual gatea species/details a IDs 1-3000,
-- y la mayoría de las plantas de interior modernas (Monstera,
-- Calathea, etc.) caen fuera de ese rango. En vez de pagar,
-- generamos la metadata con un LLM y cacheamos en esta misma
-- tabla. La PK (scientific_name normalizado) y la lógica de
-- cache no cambian — solo cambiamos las columnas para reflejar
-- exactamente los 4 campos que la app necesita.
-- ============================================================

-- 1. Sacar columnas perenual-only.
alter table public.plant_metadata drop column if exists perenual_id;
alter table public.plant_metadata drop column if exists family;
alter table public.plant_metadata drop column if exists type;
alter table public.plant_metadata drop column if exists cycle;
alter table public.plant_metadata drop column if exists watering;
alter table public.plant_metadata drop column if exists watering_benchmark_value;
alter table public.plant_metadata drop column if exists watering_benchmark_unit;
alter table public.plant_metadata drop column if exists sunlight;

-- 2. `origin` pasa de text[] a text porque el LLM devuelve una
--    región (ej. "Sudeste asiático") en vez de un array.
alter table public.plant_metadata drop column if exists origin;
alter table public.plant_metadata add column if not exists origin text;

-- 3. Campos accionables nuevos.
alter table public.plant_metadata
  add column if not exists light text
    check (light in ('directa', 'indirecta'));

alter table public.plant_metadata
  add column if not exists watering_level text
    check (watering_level in ('alto', 'medio', 'bajo'));

alter table public.plant_metadata
  add column if not exists watering_freq_days integer
    check (watering_freq_days between 1 and 60);

-- 4. Trazabilidad del modelo que generó la metadata.
alter table public.plant_metadata add column if not exists model text;

-- 5. Cambiar el default de source.
alter table public.plant_metadata alter column source set default 'haiku';

-- 6. La columna `raw` queda igual (jsonb con la respuesta del LLM
--    para futuros campos sin re-llamar al modelo).
