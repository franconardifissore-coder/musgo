-- ============================================================
-- Agrega la columna `fun_fact` a plant_metadata.
--
-- La columna almacena un dato curioso sobre la especie generado
-- por Claude Haiku junto con el resto de la metadata de cuidados.
-- Es nullable para que los rows existentes (sin fun_fact) no
-- rompan nada — la UI simplemente no muestra la sección si el
-- valor es NULL.
--
-- La migration es idempotente gracias a IF NOT EXISTS.
-- ============================================================

alter table public.plant_metadata
  add column if not exists fun_fact text;
