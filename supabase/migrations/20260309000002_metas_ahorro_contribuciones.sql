-- Wave 5b: Metas de ahorro y contribuciones
-- Issue #42

-- Tabla metas_ahorro
CREATE TABLE IF NOT EXISTS metas_ahorro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    monto_objetivo NUMERIC(15,2) NOT NULL CHECK (monto_objetivo > 0),
    monto_actual NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (monto_actual >= 0),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_objetivo DATE,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'completada', 'cancelada')),
    color TEXT,
    icono TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla contribuciones_meta
CREATE TABLE IF NOT EXISTS contribuciones_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_id UUID NOT NULL REFERENCES metas_ahorro(id) ON DELETE CASCADE,
    monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
    tipo TEXT NOT NULL CHECK (tipo IN ('deposito', 'retiro')),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_metas_ahorro_user_id ON metas_ahorro(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_ahorro_estado ON metas_ahorro(estado);
CREATE INDEX IF NOT EXISTS idx_contribuciones_meta_meta_id ON contribuciones_meta(meta_id);

-- Trigger updated_at (la funcion update_updated_at_column ya existe desde la migracion inicial)
CREATE TRIGGER update_metas_ahorro_updated_at BEFORE UPDATE ON metas_ahorro
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE metas_ahorro ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribuciones_meta ENABLE ROW LEVEL SECURITY;

-- Policies metas_ahorro: usuario solo accede a sus propias metas
CREATE POLICY "metas_ahorro_select_own" ON metas_ahorro
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "metas_ahorro_insert_own" ON metas_ahorro
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "metas_ahorro_update_own" ON metas_ahorro
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "metas_ahorro_delete_own" ON metas_ahorro
    FOR DELETE USING (auth.uid() = user_id);

-- Policies contribuciones_meta: usuario accede a contribuciones de sus metas
CREATE POLICY "contribuciones_meta_select_own" ON contribuciones_meta
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM metas_ahorro
            WHERE metas_ahorro.id = contribuciones_meta.meta_id
              AND metas_ahorro.user_id = auth.uid()
        )
    );

CREATE POLICY "contribuciones_meta_insert_own" ON contribuciones_meta
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM metas_ahorro
            WHERE metas_ahorro.id = contribuciones_meta.meta_id
              AND metas_ahorro.user_id = auth.uid()
        )
    );

CREATE POLICY "contribuciones_meta_delete_own" ON contribuciones_meta
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM metas_ahorro
            WHERE metas_ahorro.id = contribuciones_meta.meta_id
              AND metas_ahorro.user_id = auth.uid()
        )
    );

-- RPC atomica para agregar contribucion
-- Usa SECURITY DEFINER para validar ownership y ejecutar INSERT + UPDATE atomicamente.
-- La validacion de pertenencia al usuario se hace via auth.uid() en el SELECT.
CREATE OR REPLACE FUNCTION agregar_contribucion_meta(
    p_meta_id UUID,
    p_monto NUMERIC,
    p_tipo TEXT,
    p_fecha DATE,
    p_notas TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_monto_actual NUMERIC;
    v_monto_objetivo NUMERIC;
BEGIN
    -- Verificar que la meta pertenece al usuario autenticado
    SELECT monto_actual, monto_objetivo INTO v_monto_actual, v_monto_objetivo
    FROM metas_ahorro
    WHERE id = p_meta_id AND user_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meta no encontrada o no pertenece al usuario';
    END IF;

    -- Validar que un retiro no deja el saldo negativo
    IF p_tipo = 'retiro' AND p_monto > v_monto_actual THEN
        RAISE EXCEPTION 'El monto de retiro (%) supera el monto actual (%)', p_monto, v_monto_actual;
    END IF;

    -- Insertar la contribucion
    INSERT INTO contribuciones_meta (meta_id, monto, tipo, fecha, notas)
    VALUES (p_meta_id, p_monto, p_tipo, p_fecha, p_notas);

    -- Recalcular monto_actual
    IF p_tipo = 'deposito' THEN
        v_monto_actual := v_monto_actual + p_monto;
    ELSE
        v_monto_actual := v_monto_actual - p_monto;
    END IF;

    -- Actualizar meta: monto_actual y estado si alcanzó el objetivo
    UPDATE metas_ahorro
    SET monto_actual = v_monto_actual,
        estado = CASE
            WHEN v_monto_actual >= v_monto_objetivo THEN 'completada'
            ELSE estado
        END,
        updated_at = NOW()
    WHERE id = p_meta_id;
END;
$$;
