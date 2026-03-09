-- Tabla presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2000),
    monto_limite NUMERIC NOT NULL CHECK (monto_limite > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT presupuestos_unique_user_cat_mes_year
        UNIQUE (user_id, categoria_id, mes, year)
);

-- Trigger updated_at (update_updated_at_column ya existe en la DB)
CREATE TRIGGER update_presupuestos_updated_at
    BEFORE UPDATE ON presupuestos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own presupuestos"
    ON presupuestos FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own presupuestos"
    ON presupuestos FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own presupuestos"
    ON presupuestos FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own presupuestos"
    ON presupuestos FOR DELETE
    USING (user_id = auth.uid());

-- Indices
CREATE INDEX idx_presupuestos_user_id ON presupuestos(user_id);
CREATE INDEX idx_presupuestos_mes_year ON presupuestos(mes, year);
CREATE INDEX idx_presupuestos_categoria_id ON presupuestos(categoria_id);
