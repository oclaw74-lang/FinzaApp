-- ======================================================
-- Wave 6b: Movimientos de tarjeta y amortizacion de prestamos
-- Issue: tarjetas-movimientos-prestamos-amortizacion
-- ======================================================

-- ======================================================
-- PARTE 1: Tabla movimientos_tarjeta
-- ======================================================
CREATE TABLE IF NOT EXISTS movimientos_tarjeta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarjeta_id UUID NOT NULL REFERENCES tarjetas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'pago')),
    monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
    descripcion TEXT,
    fecha DATE NOT NULL,
    egreso_id UUID REFERENCES egresos(id) ON DELETE SET NULL,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mov_tarjeta_tarjeta_id ON movimientos_tarjeta(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_mov_tarjeta_user_fecha ON movimientos_tarjeta(user_id, fecha DESC);

ALTER TABLE movimientos_tarjeta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mov_tarjeta_own" ON movimientos_tarjeta
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ======================================================
-- PARTE 2: Trigger para actualizar saldo_actual de tarjeta
-- ======================================================
CREATE OR REPLACE FUNCTION update_tarjeta_saldo() RETURNS TRIGGER AS $$
DECLARE
    v_delta NUMERIC(15,2);
    v_tipo_tarjeta TEXT;
BEGIN
    SELECT tipo INTO v_tipo_tarjeta
    FROM tarjetas
    WHERE id = COALESCE(NEW.tarjeta_id, OLD.tarjeta_id);

    IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
        IF v_tipo_tarjeta = 'credito' THEN
            -- credito: compra aumenta deuda (saldo), pago la reduce
            v_delta := CASE WHEN NEW.tipo = 'compra' THEN NEW.monto ELSE -NEW.monto END;
        ELSE
            -- debito: compra reduce saldo disponible, pago (deposito) lo aumenta
            v_delta := CASE WHEN NEW.tipo = 'compra' THEN -NEW.monto ELSE NEW.monto END;
        END IF;
        UPDATE tarjetas
        SET saldo_actual = GREATEST(saldo_actual + v_delta, 0),
            updated_at = now()
        WHERE id = NEW.tarjeta_id;

    ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        -- Soft-delete: revertir el efecto original
        IF v_tipo_tarjeta = 'credito' THEN
            v_delta := CASE WHEN OLD.tipo = 'compra' THEN -OLD.monto ELSE OLD.monto END;
        ELSE
            v_delta := CASE WHEN OLD.tipo = 'compra' THEN OLD.monto ELSE -OLD.monto END;
        END IF;
        UPDATE tarjetas
        SET saldo_actual = GREATEST(saldo_actual + v_delta, 0),
            updated_at = now()
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
-- PARTE 3: Enriquecer egresos con tarjeta_id y pago_prestamo_id
-- ======================================================
ALTER TABLE egresos ADD COLUMN IF NOT EXISTS tarjeta_id UUID REFERENCES tarjetas(id) ON DELETE SET NULL;
ALTER TABLE egresos ADD COLUMN IF NOT EXISTS pago_prestamo_id UUID REFERENCES pagos_prestamo(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_egresos_tarjeta_id ON egresos(tarjeta_id)
    WHERE tarjeta_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_egresos_pago_prestamo_id ON egresos(pago_prestamo_id)
    WHERE pago_prestamo_id IS NOT NULL;

-- ======================================================
-- PARTE 4: Enriquecer pagos_prestamo con capital/interes/numero_cuota
-- ======================================================
ALTER TABLE pagos_prestamo ADD COLUMN IF NOT EXISTS monto_capital NUMERIC(15,2);
ALTER TABLE pagos_prestamo ADD COLUMN IF NOT EXISTS monto_interes NUMERIC(15,2);
ALTER TABLE pagos_prestamo ADD COLUMN IF NOT EXISTS numero_cuota INTEGER;

-- ======================================================
-- PARTE 5: RPC atomica para registrar movimiento de tarjeta
-- ======================================================
CREATE OR REPLACE FUNCTION registrar_movimiento_tarjeta(
    p_tarjeta_id UUID,
    p_user_id UUID,
    p_tipo TEXT,
    p_monto NUMERIC,
    p_fecha DATE,
    p_descripcion TEXT DEFAULT NULL,
    p_notas TEXT DEFAULT NULL,
    p_categoria_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_tarjeta RECORD;
    v_mov_id UUID;
    v_egreso_id UUID := NULL;
BEGIN
    SELECT * INTO v_tarjeta
    FROM tarjetas
    WHERE id = p_tarjeta_id AND user_id = p_user_id AND activa = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tarjeta no encontrada o inactiva';
    END IF;

    -- Validar limite de credito para compras en tarjeta de credito
    IF p_tipo = 'compra' AND v_tarjeta.tipo = 'credito' AND v_tarjeta.limite_credito IS NOT NULL THEN
        IF (v_tarjeta.saldo_actual + p_monto) > v_tarjeta.limite_credito THEN
            RAISE EXCEPTION 'La compra excede el limite de credito disponible (disponible: %, intento: %)',
                (v_tarjeta.limite_credito - v_tarjeta.saldo_actual), p_monto;
        END IF;
    END IF;

    -- Validar saldo suficiente para compras en tarjeta de debito
    IF p_tipo = 'compra' AND v_tarjeta.tipo = 'debito' THEN
        IF p_monto > v_tarjeta.saldo_actual THEN
            RAISE EXCEPTION 'Saldo insuficiente en tarjeta de debito (disponible: %, intento: %)',
                v_tarjeta.saldo_actual, p_monto;
        END IF;
    END IF;

    -- Validar que el pago no exceda la deuda en tarjeta de credito
    IF p_tipo = 'pago' AND v_tarjeta.tipo = 'credito' THEN
        IF p_monto > v_tarjeta.saldo_actual THEN
            RAISE EXCEPTION 'El pago excede la deuda actual de la tarjeta (deuda: %, pago: %)',
                v_tarjeta.saldo_actual, p_monto;
        END IF;
    END IF;

    -- Crear egreso automatico para compras con categoria
    IF p_tipo = 'compra' AND p_categoria_id IS NOT NULL THEN
        INSERT INTO egresos (user_id, categoria_id, monto, moneda, descripcion, metodo_pago, fecha, notas, tarjeta_id)
        VALUES (p_user_id, p_categoria_id, p_monto, 'DOP', p_descripcion, 'tarjeta', p_fecha, p_notas, p_tarjeta_id)
        RETURNING id INTO v_egreso_id;
    END IF;

    INSERT INTO movimientos_tarjeta (tarjeta_id, user_id, tipo, monto, descripcion, fecha, egreso_id, notas)
    VALUES (p_tarjeta_id, p_user_id, p_tipo, p_monto, p_descripcion, p_fecha, v_egreso_id, p_notas)
    RETURNING id INTO v_mov_id;

    RETURN json_build_object(
        'movimiento_id', v_mov_id,
        'egreso_id', v_egreso_id,
        'tipo', p_tipo,
        'monto', p_monto
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================
-- PARTE 6: Reemplazar RPC registrar_pago_prestamo con separacion capital/interes
-- Mantiene la misma firma (p_prestamo_id, p_user_id, p_monto, p_fecha, p_notas)
-- para backward compatibility con el servicio Python existente.
-- ======================================================
CREATE OR REPLACE FUNCTION registrar_pago_prestamo(
    p_prestamo_id UUID,
    p_user_id UUID,
    p_monto NUMERIC,
    p_fecha DATE,
    p_notas TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_prestamo RECORD;
    v_tasa_mensual NUMERIC;
    v_interes NUMERIC(15,2);
    v_capital NUMERIC(15,2);
    v_nuevo_pendiente NUMERIC(15,2);
    v_nuevo_estado estado_prestamo;
    v_pago_id UUID;
    v_num_cuota INTEGER;
BEGIN
    SELECT * INTO v_prestamo
    FROM prestamos
    WHERE id = p_prestamo_id AND user_id = p_user_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prestamo no encontrado';
    END IF;

    IF v_prestamo.estado != 'activo' THEN
        RAISE EXCEPTION 'Prestamo no esta activo (estado: %)', v_prestamo.estado;
    END IF;

    -- Calcular desglose capital/interes (amortizacion francesa)
    IF v_prestamo.tasa_interes IS NOT NULL AND v_prestamo.tasa_interes > 0 THEN
        v_tasa_mensual := v_prestamo.tasa_interes / 100.0 / 12.0;
        v_interes := ROUND(v_prestamo.monto_pendiente * v_tasa_mensual, 2);
        IF p_monto <= v_interes THEN
            -- El pago no alcanza ni para el interes: todo va a interes
            v_interes := p_monto;
            v_capital := 0;
        ELSE
            v_capital := p_monto - v_interes;
        END IF;
    ELSE
        v_interes := 0;
        v_capital := p_monto;
    END IF;

    IF v_capital > v_prestamo.monto_pendiente THEN
        RAISE EXCEPTION 'Monto (%) excede el pendiente (%)', p_monto, v_prestamo.monto_pendiente;
    END IF;

    v_nuevo_pendiente := v_prestamo.monto_pendiente - v_capital;
    v_nuevo_estado := CASE
        WHEN v_nuevo_pendiente = 0 THEN 'pagado'::estado_prestamo
        ELSE 'activo'::estado_prestamo
    END;

    -- Obtener numero de cuota siguiente
    SELECT COALESCE(MAX(numero_cuota), 0) + 1 INTO v_num_cuota
    FROM pagos_prestamo
    WHERE prestamo_id = p_prestamo_id AND deleted_at IS NULL;

    INSERT INTO pagos_prestamo (prestamo_id, user_id, monto, monto_capital, monto_interes, numero_cuota, fecha, notas)
    VALUES (p_prestamo_id, p_user_id, p_monto, v_capital, v_interes, v_num_cuota, p_fecha, p_notas)
    RETURNING id INTO v_pago_id;

    UPDATE prestamos
    SET monto_pendiente = v_nuevo_pendiente,
        estado = v_nuevo_estado,
        updated_at = now()
    WHERE id = p_prestamo_id;

    RETURN json_build_object(
        'pago_id', v_pago_id,
        'monto_capital', v_capital,
        'monto_interes', v_interes,
        'numero_cuota', v_num_cuota,
        'monto_pendiente', v_nuevo_pendiente,
        'estado', v_nuevo_estado
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
