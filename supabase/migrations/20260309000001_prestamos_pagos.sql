-- Wave 5a: Prestamos y pagos
-- Issue #38

-- Enums
CREATE TYPE tipo_prestamo AS ENUM ('me_deben', 'yo_debo');
CREATE TYPE estado_prestamo AS ENUM ('activo', 'pagado', 'vencido');

-- Tabla prestamos
CREATE TABLE IF NOT EXISTS prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo tipo_prestamo NOT NULL,
    persona TEXT NOT NULL,
    monto_original NUMERIC(15,2) NOT NULL CHECK (monto_original > 0),
    monto_pendiente NUMERIC(15,2) NOT NULL CHECK (monto_pendiente >= 0),
    moneda TEXT NOT NULL DEFAULT 'DOP',
    fecha_prestamo DATE NOT NULL,
    fecha_vencimiento DATE,
    descripcion TEXT,
    estado estado_prestamo NOT NULL DEFAULT 'activo',
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Tabla pagos_prestamo
CREATE TABLE IF NOT EXISTS pagos_prestamo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id UUID NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
    fecha DATE NOT NULL,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_prestamos_user_id ON prestamos(user_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_tipo ON prestamos(tipo);
CREATE INDEX IF NOT EXISTS idx_pagos_prestamo_id ON pagos_prestamo(prestamo_id);

-- Trigger updated_at (la funcion update_updated_at_column ya existe desde la migracion inicial)
CREATE TRIGGER update_prestamos_updated_at BEFORE UPDATE ON prestamos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_prestamo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prestamos_select_own" ON prestamos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prestamos_insert_own" ON prestamos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prestamos_update_own" ON prestamos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prestamos_delete_own" ON prestamos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "pagos_prestamo_select_own" ON pagos_prestamo FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pagos_prestamo_insert_own" ON pagos_prestamo FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pagos_prestamo_delete_own" ON pagos_prestamo FOR DELETE USING (auth.uid() = user_id);

-- RPC atomica para registrar pago
-- Usa SECURITY DEFINER para que la funcion se ejecute con permisos del owner (superuser),
-- lo que permite la operacion atomica UPDATE + INSERT sin depender de RLS durante la transaccion.
-- La validacion de ownership se hace explicitamente via WHERE user_id = p_user_id.
CREATE OR REPLACE FUNCTION registrar_pago_prestamo(
    p_prestamo_id UUID,
    p_user_id UUID,
    p_monto NUMERIC,
    p_fecha DATE,
    p_notas TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_prestamo RECORD;
    v_nuevo_pendiente NUMERIC(15,2);
    v_nuevo_estado estado_prestamo;
    v_pago_id UUID;
BEGIN
    SELECT * INTO v_prestamo FROM prestamos
    WHERE id = p_prestamo_id AND user_id = p_user_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prestamo no encontrado';
    END IF;
    IF v_prestamo.estado != 'activo' THEN
        RAISE EXCEPTION 'Prestamo no esta activo (estado: %)', v_prestamo.estado;
    END IF;
    IF p_monto > v_prestamo.monto_pendiente THEN
        RAISE EXCEPTION 'Monto (%) excede el pendiente (%)', p_monto, v_prestamo.monto_pendiente;
    END IF;

    v_nuevo_pendiente := v_prestamo.monto_pendiente - p_monto;
    v_nuevo_estado := CASE
        WHEN v_nuevo_pendiente = 0 THEN 'pagado'::estado_prestamo
        ELSE 'activo'::estado_prestamo
    END;

    INSERT INTO pagos_prestamo (prestamo_id, user_id, monto, fecha, notas)
    VALUES (p_prestamo_id, p_user_id, p_monto, p_fecha, p_notas)
    RETURNING id INTO v_pago_id;

    UPDATE prestamos
    SET monto_pendiente = v_nuevo_pendiente,
        estado = v_nuevo_estado,
        updated_at = now()
    WHERE id = p_prestamo_id;

    RETURN json_build_object(
        'pago_id', v_pago_id,
        'monto_pendiente', v_nuevo_pendiente,
        'estado', v_nuevo_estado
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
