-- Drop legacy columns that are no longer used in the application.
-- `outdoor` was an auto-derived flag on sections (inferred from the section name).
-- `light` was a plant preference field removed in the UI redesign.

ALTER TABLE sections DROP COLUMN IF EXISTS outdoor;
ALTER TABLE plants   DROP COLUMN IF EXISTS light;
