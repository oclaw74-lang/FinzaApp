CREATE TABLE suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'DOP',
    frecuencia TEXT NOT NULL CHECK (frecuencia IN ('mensual', 'anual', 'semanal', 'trimestral')),
    categoria_id UUID REFERENCES categorias(id),
    fecha_proximo_cobro DATE,
    activa BOOLEAN NOT NULL DEFAULT true,
    auto_detectada BOOLEAN NOT NULL DEFAULT false,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suscripciones"
    ON suscripciones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suscripciones"
    ON suscripciones FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suscripciones"
    ON suscripciones FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own suscripciones"
    ON suscripciones FOR DELETE
    USING (auth.uid() = user_id);

CREATE TRIGGER update_suscripciones_updated_at
    BEFORE UPDATE ON suscripciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_suscripciones_user_id ON suscripciones(user_id);
CREATE INDEX idx_suscripciones_activa ON suscripciones(user_id, activa);
