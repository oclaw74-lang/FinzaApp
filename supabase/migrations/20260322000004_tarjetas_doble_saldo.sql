-- Tarjetas con Doble Saldo
-- Algunas tarjetas de crédito tienen dos líneas independientes:
--   1. Línea en moneda principal (saldo_actual / limite_credito existentes)
--   2. Línea en moneda secundaria del usuario (saldo_secundario / limite_secundario)
-- Estas líneas se pagan de forma independiente.

ALTER TABLE tarjetas
  ADD COLUMN IF NOT EXISTS saldo_secundario   NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS limite_secundario  NUMERIC(15, 2) NOT NULL DEFAULT 0;
