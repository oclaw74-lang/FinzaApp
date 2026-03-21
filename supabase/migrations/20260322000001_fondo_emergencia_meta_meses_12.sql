-- Allow meta_meses = 12 in fondo_emergencia
-- Previously the constraint was IN (1, 3, 6) which rejected the "12 meses" option
-- that the UI exposes, causing a CHECK constraint violation (SQLSTATE 23514) → 500 error.

ALTER TABLE fondo_emergencia
  DROP CONSTRAINT IF EXISTS fondo_emergencia_meta_meses_check;

ALTER TABLE fondo_emergencia
  ADD CONSTRAINT fondo_emergencia_meta_meses_check
  CHECK (meta_meses IN (1, 3, 6, 12));
