-- ============================================================
-- Fix Security Advisor issues flagged on 07 Apr 2026
-- ============================================================

-- 1. Enable RLS on legacy tables watering_logs and rain_logs.
--    These tables are not used by the current application.
--    Enabling RLS without policies blocks all PostgREST API access,
--    which is the safest default for unused tables.
ALTER TABLE IF EXISTS public.watering_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rain_logs     ENABLE ROW LEVEL SECURITY;


-- 2. Pin search_path on set_updated_at to prevent schema-injection attacks.
--    This does not change the function body, only adds the security setting.
ALTER FUNCTION public.set_updated_at() SET search_path = '';


-- 3. Restrict the plant-images storage SELECT policy.
--    The previous "Anyone can view plant images" policy allowed ANY client to
--    LIST all files in the bucket via the API.
--    Public <img src> URLs (via /storage/v1/object/public/) are served by the
--    CDN and bypass RLS entirely, so those still work after this change.
DROP POLICY IF EXISTS "Anyone can view plant images" ON storage.objects;

CREATE POLICY "Users can view own plant images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'plant-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- NOTE (manual step required):
-- "Leaked Password Protection Disabled" cannot be fixed via SQL.
-- Enable it in the Supabase Dashboard:
--   Authentication → Settings → "Enable leaked password protection"
