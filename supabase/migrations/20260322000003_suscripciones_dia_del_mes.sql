-- Add dia_del_mes and fecha_inicio to suscripciones
-- dia_del_mes: day of month (1-31) for auto-calculating fecha_proximo_cobro
-- fecha_inicio: optional subscription start date

ALTER TABLE suscripciones
  ADD COLUMN IF NOT EXISTS dia_del_mes SMALLINT CHECK (dia_del_mes BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS fecha_inicio DATE;
