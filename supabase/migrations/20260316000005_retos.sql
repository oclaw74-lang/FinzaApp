CREATE TABLE retos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('semanal', 'mensual')),
    ahorro_estimado NUMERIC(12,2),
    icono TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_retos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reto_id UUID NOT NULL REFERENCES retos(id) ON DELETE CASCADE,
    estado TEXT NOT NULL CHECK (estado IN ('activo', 'completado', 'abandonado')) DEFAULT 'activo',
    racha_dias INT NOT NULL DEFAULT 0,
    ultimo_checkin DATE,
    iniciado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    completado_en TIMESTAMPTZ,
    UNIQUE(user_id, reto_id)
);
ALTER TABLE user_retos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own retos" ON user_retos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_user_retos_user_id ON user_retos(user_id);

-- Seed de retos base
INSERT INTO retos (titulo, descripcion, tipo, ahorro_estimado, icono) VALUES
('Sin cafe fuera de casa', 'No compres cafe en establecimientos por 7 dias', 'semanal', 500, '☕'),
('Semana sin delivery', 'Cocina en casa todos los dias esta semana', 'semanal', 1000, '🍳'),
('Mes sin compras impulsivas', 'Evita compras no planificadas durante 30 dias', 'mensual', 3000, '🛍️'),
('Ahorra el 10% extra', 'Deposita 10% adicional de tu ingreso al fondo de emergencia', 'mensual', 0, '💰'),
('Revision diaria de gastos', 'Registra todos tus gastos durante 7 dias consecutivos', 'semanal', 0, '📊');
