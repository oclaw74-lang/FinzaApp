CREATE TABLE IF NOT EXISTS estados_cuenta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tarjeta_id UUID REFERENCES tarjetas(id) ON DELETE SET NULL,
    nombre_archivo TEXT NOT NULL,
    url_archivo TEXT NOT NULL,
    fecha_estado DATE,
    monto_total NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE estados_cuenta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own estados_cuenta" ON estados_cuenta
    FOR ALL USING (auth.uid() = user_id);
