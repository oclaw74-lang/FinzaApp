-- Add moneda column to presupuestos
-- Existing rows default to 'DOP' for backwards compatibility.

ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'DOP';
