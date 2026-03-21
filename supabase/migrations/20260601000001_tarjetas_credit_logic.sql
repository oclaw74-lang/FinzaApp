-- ======================================================
-- G2: Credit card transaction logic redesign
-- Issue: tarjetas-credit-logic
-- Correct logic:
--   credito + compra  → saldo_actual ↑  (deuda sube)  │ NO egreso
--   credito + pago    → saldo_actual ↓                  │ ✅ egreso
--   debito  + compra  → saldo_actual ↓                  │ ✅ egreso
--   debito  + deposito→ saldo_actual ↑                  │ ✅ ingreso
-- ======================================================

-- ======================================================
-- PARTE 1: Add ingreso_id column to movimientos_tarjeta
-- ======================================================
ALTER TABLE movimientos_tarjeta
  ADD COLUMN IF NOT EXISTS ingreso_id UUID REFERENCES ingresos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mov_tarjeta_ingreso_id ON movimientos_tarjeta(ingreso_id)
  WHERE ingreso_id IS NOT NULL;

-- ======================================================
-- PARTE 2: Update tipo CHECK constraint to include 'deposito'
-- Drop the auto-generated constraint and recreate with new values.
-- ======================================================
DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'movimientos_tarjeta'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%compra%'
    AND pg_get_constraintdef(oid) LIKE '%pago%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE movimientos_tarjeta DROP CONSTRAINT ' || quote_ident(v_constraint_name);
  END IF;
END $$;

ALTER TABLE movimientos_tarjeta
  ADD CONSTRAINT movimientos_tarjeta_tipo_check
  CHECK (tipo IN ('compra', 'pago', 'deposito'));

-- ======================================================
-- PARTE 3: Recreate trigger (same logic, explicit deposito comment)
-- debito non-compra (pago, deposito) → saldo sube
-- credito non-compra (pago)          → saldo baja
-- ======================================================
CREATE OR REPLACE FUNCTION update_tarjeta_saldo() RETURNS TRIGGER AS $$
DECLARE
  v_delta        NUMERIC(15,2);
  v_tipo_tarjeta TEXT;
BEGIN
  SELECT tipo INTO v_tipo_tarjeta
  FROM tarjetas
  WHERE id = COALESCE(NEW.tarjeta_id, OLD.tarjeta_id);

  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    IF v_tipo_tarjeta = 'credito' THEN
      -- credito: compra aumenta deuda, pago la reduce
      v_delta := CASE WHEN NEW.tipo = 'compra' THEN NEW.monto ELSE -NEW.monto END;
    ELSE
      -- debito: compra reduce saldo, deposito/pago lo aumenta
      v_delta := CASE WHEN NEW.tipo = 'compra' THEN -NEW.monto ELSE NEW.monto END;
    END IF;
    UPDATE tarjetas
    SET saldo_actual = GREATEST(saldo_actual + v_delta, 0),
        updated_at   = now()
    WHERE id = NEW.tarjeta_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Soft-delete: revert the original effect
    IF v_tipo_tarjeta = 'credito' THEN
      v_delta := CASE WHEN OLD.tipo = 'compra' THEN -OLD.monto ELSE OLD.monto END;
    ELSE
      v_delta := CASE WHEN OLD.tipo = 'compra' THEN OLD.monto ELSE -OLD.monto END;
    END IF;
    UPDATE tarjetas
    SET saldo_actual = GREATEST(saldo_actual + v_delta, 0),
        updated_at   = now()
    WHERE id = OLD.tarjeta_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_tarjeta_saldo ON movimientos_tarjeta;
CREATE TRIGGER trg_update_tarjeta_saldo
  AFTER INSERT OR UPDATE ON movimientos_tarjeta
  FOR EACH ROW EXECUTE FUNCTION update_tarjeta_saldo();

-- ======================================================
-- PARTE 4: Replace RPC registrar_movimiento_tarjeta
-- ======================================================
CREATE OR REPLACE FUNCTION registrar_movimiento_tarjeta(
  p_tarjeta_id   UUID,
  p_user_id      UUID,
  p_tipo         TEXT,
  p_monto        NUMERIC,
  p_fecha        DATE,
  p_descripcion  TEXT DEFAULT NULL,
  p_notas        TEXT DEFAULT NULL,
  p_categoria_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_tarjeta    RECORD;
  v_mov_id     UUID;
  v_egreso_id  UUID := NULL;
  v_ingreso_id UUID := NULL;
BEGIN
  -- Lock and fetch tarjeta
  SELECT * INTO v_tarjeta
  FROM tarjetas
  WHERE id = p_tarjeta_id AND user_id = p_user_id AND activa = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarjeta no encontrada o inactiva';
  END IF;

  -- deposito is only for debit cards
  IF p_tipo = 'deposito' AND v_tarjeta.tipo = 'credito' THEN
    RAISE EXCEPTION 'No se puede registrar un deposito en una tarjeta de credito';
  END IF;

  -- Validate credit limit for credit card purchases
  IF p_tipo = 'compra' AND v_tarjeta.tipo = 'credito' AND v_tarjeta.limite_credito IS NOT NULL THEN
    IF (v_tarjeta.saldo_actual + p_monto) > v_tarjeta.limite_credito THEN
      RAISE EXCEPTION 'La compra excede el limite de credito disponible (disponible: %, intento: %)',
        (v_tarjeta.limite_credito - v_tarjeta.saldo_actual), p_monto;
    END IF;
  END IF;

  -- Validate sufficient balance for debit card purchases
  IF p_tipo = 'compra' AND v_tarjeta.tipo = 'debito' THEN
    IF p_monto > v_tarjeta.saldo_actual THEN
      RAISE EXCEPTION 'Saldo insuficiente en tarjeta de debito (disponible: %, intento: %)',
        v_tarjeta.saldo_actual, p_monto;
    END IF;
  END IF;

  -- Validate payment does not exceed credit card debt
  IF p_tipo = 'pago' AND v_tarjeta.tipo = 'credito' THEN
    IF p_monto > v_tarjeta.saldo_actual THEN
      RAISE EXCEPTION 'El pago excede la deuda actual de la tarjeta (deuda: %, pago: %)',
        v_tarjeta.saldo_actual, p_monto;
    END IF;
  END IF;

  -- ─── Create linked financial record ────────────────────────────────────────
  -- Credit compra → NO egreso (debt tracked via saldo_actual only)
  -- Debit  compra → egreso (spending debits user balance via card)
  -- Any    pago   → egreso (cash leaves user balance to pay card or debit charge)
  -- Debit  deposito→ ingreso (cash enters card balance)
  -- egreso/ingreso only created when categoria_id provided (FK NOT NULL constraint)

  IF p_tipo = 'compra' AND v_tarjeta.tipo = 'debito' AND p_categoria_id IS NOT NULL THEN
    INSERT INTO egresos
      (user_id, categoria_id, monto, moneda, descripcion, metodo_pago, fecha, notas, tarjeta_id)
    VALUES
      (p_user_id, p_categoria_id, p_monto, 'DOP', p_descripcion, 'tarjeta', p_fecha, p_notas, p_tarjeta_id)
    RETURNING id INTO v_egreso_id;

  ELSIF p_tipo = 'pago' AND p_categoria_id IS NOT NULL THEN
    -- Works for both credito (paying debt) and debito (debit card charge reversal)
    INSERT INTO egresos
      (user_id, categoria_id, monto, moneda, descripcion, metodo_pago, fecha, notas, tarjeta_id)
    VALUES
      (p_user_id, p_categoria_id, p_monto, 'DOP', p_descripcion, 'tarjeta', p_fecha, p_notas, p_tarjeta_id)
    RETURNING id INTO v_egreso_id;

  ELSIF p_tipo = 'deposito' AND v_tarjeta.tipo = 'debito' AND p_categoria_id IS NOT NULL THEN
    INSERT INTO ingresos
      (user_id, categoria_id, monto, moneda, descripcion, fecha, notas)
    VALUES
      (p_user_id, p_categoria_id, p_monto, 'DOP', p_descripcion, p_fecha, p_notas)
    RETURNING id INTO v_ingreso_id;
  END IF;

  -- Insert movement record (trigger updates saldo_actual automatically)
  INSERT INTO movimientos_tarjeta
    (tarjeta_id, user_id, tipo, monto, descripcion, fecha, egreso_id, ingreso_id, notas)
  VALUES
    (p_tarjeta_id, p_user_id, p_tipo, p_monto, p_descripcion, p_fecha, v_egreso_id, v_ingreso_id, p_notas)
  RETURNING id INTO v_mov_id;

  RETURN json_build_object(
    'movimiento_id', v_mov_id,
    'egreso_id',     v_egreso_id,
    'ingreso_id',    v_ingreso_id,
    'tipo',          p_tipo,
    'tipo_tarjeta',  v_tarjeta.tipo,
    'monto',         p_monto
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================
-- PARTE 5: Clean up incorrect egresos for credit card compras
-- Soft-delete egresos that were incorrectly created, null out egreso_id
-- ======================================================
UPDATE egresos
SET deleted_at = NOW()
WHERE id IN (
  SELECT mt.egreso_id
  FROM movimientos_tarjeta mt
  JOIN tarjetas t ON mt.tarjeta_id = t.id
  WHERE t.tipo = 'credito'
    AND mt.tipo = 'compra'
    AND mt.egreso_id IS NOT NULL
    AND mt.deleted_at IS NULL
);

UPDATE movimientos_tarjeta mt
SET egreso_id = NULL
FROM tarjetas t
WHERE mt.tarjeta_id = t.id
  AND t.tipo = 'credito'
  AND mt.tipo = 'compra'
  AND mt.egreso_id IS NOT NULL;
