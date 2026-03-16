CREATE TABLE lecciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion_corta TEXT NOT NULL,
    contenido_json JSONB NOT NULL,
    nivel TEXT NOT NULL CHECK (nivel IN ('fundamentos', 'control', 'crecimiento')),
    duracion_minutos INT NOT NULL DEFAULT 3,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_lecciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    leccion_id UUID NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
    completada BOOLEAN NOT NULL DEFAULT false,
    completada_en TIMESTAMPTZ,
    UNIQUE(user_id, leccion_id)
);
ALTER TABLE user_lecciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON user_lecciones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_user_lecciones_user_id ON user_lecciones(user_id);

-- Seed de lecciones
INSERT INTO lecciones (titulo, descripcion_corta, contenido_json, nivel, duracion_minutos, orden) VALUES
('El presupuesto 50/30/20', 'Aprende a distribuir tus ingresos con la regla mas popular', '{"hook":"La mayoria de las personas gasta sin plan","concept":"Divide tu ingreso: 50% necesidades, 30% deseos, 20% ahorro","action":"Revisa tus egresos del ultimo mes y clasificalos en estas 3 categorias","tip":"Finza ya calcula automaticamente tu balance — usalo como punto de partida"}', 'fundamentos', 3, 1),
('Fondo de emergencia', 'Por que necesitas 3 meses de gastos guardados', '{"hook":"El 65% de las personas no podria cubrir un gasto inesperado de $5,000","concept":"Un fondo de emergencia evita que las crisis financieras se conviertan en deudas","action":"Calcula tus gastos mensuales promedio y define tu meta en Finza","tip":"Empieza con 1 mes de gastos y aumenta gradualmente"}', 'fundamentos', 3, 2),
('Como salir de deudas', 'Metodo avalancha vs metodo bola de nieve', '{"hook":"Las deudas con alta tasa de interes pueden duplicarse en 5 anos","concept":"Avalancha: paga primero la deuda con mayor interes. Bola de nieve: paga primero la mas pequena","action":"Lista tus prestamos en Finza y calcula el costo mensual de intereses","tip":"Finza te muestra el costo real de tus deudas en la comparativa"}', 'control', 4, 3),
('Invierte el 10%', 'El habito que mas impacto tiene en tu futuro financiero', '{"hook":"Invertir $1,000 mensuales durante 20 anos puede generar mas de $600,000","concept":"La inversion consistente supera a la inversion perfecta gracias al interes compuesto","action":"Configura una meta de ahorro en Finza y activa transferencia automatica","tip":"Empieza aunque sea con el 1% — el habito es mas importante que el monto"}', 'crecimiento', 4, 4),
('Gastos hormiga', 'Los pequenos gastos que se comen tu ahorro', '{"hook":"Un cafe de $150 diario son $54,000 al ano","concept":"Los gastos pequenos y frecuentes son dificiles de notar pero acumulan una cifra enorme","action":"Activa el detector de impulso en Finza y revisa tus patrones del ultimo mes","tip":"No se trata de eliminar todos los placeres — sino de decidir conscientemente"}', 'control', 3, 5);
