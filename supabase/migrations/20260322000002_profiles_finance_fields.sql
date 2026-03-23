-- Add finance/salary fields to profiles table
-- These fields are defined in the ProfileUpdate/ProfileResponse schemas
-- but were never added via migration.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS salario_bruto          NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS salario_neto            NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS descuentos_adicionales  NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS frecuencia_pago         TEXT          DEFAULT NULL
    CHECK (frecuencia_pago IS NULL OR frecuencia_pago IN ('quincenal', 'bisemanal', 'mensual')),
  ADD COLUMN IF NOT EXISTS porcentaje_ahorro_metas NUMERIC(5,2)  DEFAULT NULL
    CHECK (porcentaje_ahorro_metas IS NULL OR (porcentaje_ahorro_metas >= 0 AND porcentaje_ahorro_metas <= 100)),
  ADD COLUMN IF NOT EXISTS porcentaje_ahorro_fondo NUMERIC(5,2)  DEFAULT NULL
    CHECK (porcentaje_ahorro_fondo IS NULL OR (porcentaje_ahorro_fondo >= 0 AND porcentaje_ahorro_fondo <= 100)),
  ADD COLUMN IF NOT EXISTS asignacion_automatica_activa BOOLEAN NOT NULL DEFAULT false;
