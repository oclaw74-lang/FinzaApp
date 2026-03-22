-- Add "cancelado" as a valid estado for prestamos.
-- Previously the CHECK constraint only allowed 'activo', 'pagado', 'vencido'.
-- Users need to be able to cancel an active loan without marking it as paid.

ALTER TABLE prestamos
  DROP CONSTRAINT IF EXISTS prestamos_estado_check;

ALTER TABLE prestamos
  ADD CONSTRAINT prestamos_estado_check
  CHECK (estado IN ('activo', 'pagado', 'vencido', 'cancelado'));
