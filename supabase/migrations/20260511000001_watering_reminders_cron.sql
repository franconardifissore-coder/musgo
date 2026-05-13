-- ============================================================
-- Cron job: recordatorios de riego diarios
--
-- Llama a la Edge Function send-watering-reminders todos los días
-- a las 9:00 AM UTC (6 AM Argentina / 11 AM España).
--
-- Requiere que pg_cron y pg_net estén habilitados en el proyecto.
-- Supabase los incluye por defecto.
-- ============================================================

-- Habilitar extensiones necesarias (no fallan si ya están activas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Programar el cron (si ya existe, reemplazarlo)
SELECT cron.unschedule('musgo-watering-reminders') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'musgo-watering-reminders'
);

SELECT cron.schedule(
  'musgo-watering-reminders',
  '0 9 * * *',   -- cada día a las 9:00 UTC
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-watering-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ============================================================
-- NOTA: los settings app.supabase_url y app.service_role_key
-- deben configurarse una sola vez en el proyecto ejecutando:
--
--   ALTER DATABASE postgres
--     SET app.supabase_url = 'https://<tu-ref>.supabase.co';
--
--   ALTER DATABASE postgres
--     SET app.service_role_key = '<tu-service-role-key>';
--
-- Hacerlo desde Supabase Dashboard → SQL Editor.
-- ============================================================
