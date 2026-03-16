CREATE TABLE fondo_emergencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    monto_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
    meta_meses INT NOT NULL DEFAULT 3 CHECK (meta_meses IN (1, 3, 6)),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fondo_emergencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fondo_emergencia"
    ON fondo_emergencia FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fondo_emergencia"
    ON fondo_emergencia FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fondo_emergencia"
    ON fondo_emergencia FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fondo_emergencia"
    ON fondo_emergencia FOR DELETE
    USING (auth.uid() = user_id);

CREATE TRIGGER update_fondo_emergencia_updated_at
    BEFORE UPDATE ON fondo_emergencia
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_fondo_emergencia_user_id ON fondo_emergencia(user_id);
