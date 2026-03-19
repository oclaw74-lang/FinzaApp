-- Tabla de transacciones recurrentes
CREATE TABLE IF NOT EXISTS recurrentes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(15, 2) NOT NULL CHECK (monto > 0),
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diaria', 'semanal', 'quincenal', 'mensual')),
    dia_del_mes INTEGER CHECK (dia_del_mes BETWEEN 1 AND 31),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE recurrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurrentes"
    ON recurrentes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indices
CREATE INDEX IF NOT EXISTS idx_recurrentes_user_id ON recurrentes(user_id);
CREATE INDEX IF NOT EXISTS idx_recurrentes_activo ON recurrentes(user_id, activo);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_recurrentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recurrentes_updated_at
    BEFORE UPDATE ON recurrentes
    FOR EACH ROW EXECUTE FUNCTION update_recurrentes_updated_at();
