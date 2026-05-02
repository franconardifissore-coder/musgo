-- ============================================================
-- Migración: historial de fotos de plantas
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Tabla principal de fotos
CREATE TABLE IF NOT EXISTS plant_photos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id    UUID        NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  note        TEXT,
  taken_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índice para queries por planta (ordenadas por fecha)
CREATE INDEX IF NOT EXISTS plant_photos_plant_id_taken_at_idx
  ON plant_photos (plant_id, taken_at DESC);

-- 3. Row Level Security
ALTER TABLE plant_photos ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver/modificar sus propias fotos
CREATE POLICY "plant_photos_owner_all"
  ON plant_photos
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage: el bucket "plant-images" ya existe.
-- Las fotos del historial se guardan en una subcarpeta:
--   {user_id}/photos/{plant_id}/{timestamp_ms}.jpg
--
-- Si el bucket aún no tiene política pública de lectura,
-- ejecutar también:
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('plant-images', 'plant-images', true)
--   ON CONFLICT (id) DO UPDATE SET public = true;
