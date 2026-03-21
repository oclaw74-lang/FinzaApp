-- Migration: dual_moneda
-- Adds secondary currency and exchange rate to user_config.
-- Adds moneda column to tarjetas, metas_ahorro, fondo_emergencia.

-- ============================================================
-- 1. USER_CONFIG — secondary currency + exchange rate
-- ============================================================
ALTER TABLE user_config
  ADD COLUMN IF NOT EXISTS moneda_secundaria TEXT,
  ADD COLUMN IF NOT EXISTS tasa_cambio NUMERIC(15,6) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS tasa_cambio_actualizada_at TIMESTAMPTZ;

-- ============================================================
-- 2. TARJETAS — add moneda column
-- ============================================================
ALTER TABLE tarjetas ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'DOP';

-- ============================================================
-- 3. METAS_AHORRO — add moneda column
-- ============================================================
ALTER TABLE metas_ahorro ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'DOP';

-- ============================================================
-- 4. FONDO_EMERGENCIA — add moneda column
-- ============================================================
ALTER TABLE fondo_emergencia ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'DOP';

-- ============================================================
-- 5. Backfill tarjetas.moneda from user_config.moneda
-- ============================================================
UPDATE tarjetas t
  SET moneda = COALESCE(
    (SELECT uc.moneda FROM user_config uc WHERE uc.user_id = t.user_id LIMIT 1),
    'DOP'
  )
  WHERE moneda IS NULL OR moneda = 'DOP';

-- ============================================================
-- 6. Backfill metas_ahorro.moneda from user_config.moneda
-- ============================================================
UPDATE metas_ahorro m
  SET moneda = COALESCE(
    (SELECT uc.moneda FROM user_config uc WHERE uc.user_id = m.user_id LIMIT 1),
    'DOP'
  )
  WHERE moneda IS NULL OR moneda = 'DOP';
