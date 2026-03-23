-- Consolidate salary fields: remove salario_mensual_neto, use salario_neto everywhere.
-- salario_neto = salario_bruto - descuentos_adicionales (computed and stored).
-- Preserve any existing data by copying to salario_neto if not yet set.

UPDATE profiles
  SET salario_neto = salario_mensual_neto
  WHERE salario_neto IS NULL AND salario_mensual_neto IS NOT NULL;

ALTER TABLE profiles DROP COLUMN IF EXISTS salario_mensual_neto;
