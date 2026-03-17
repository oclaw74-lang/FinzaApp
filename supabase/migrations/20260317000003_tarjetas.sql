CREATE TABLE tarjetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banco TEXT NOT NULL,
  titular TEXT NOT NULL,
  ultimos_digitos TEXT NOT NULL CHECK (char_length(ultimos_digitos) = 4),
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  red TEXT NOT NULL CHECK (red IN ('visa', 'mastercard', 'amex', 'otra')),
  limite_credito NUMERIC(12,2),   -- NULL para debito
  saldo_actual NUMERIC(12,2) DEFAULT 0,  -- deuda actual en credito / saldo en debito
  fecha_corte INTEGER,            -- dia del mes (1-31), NULL para debito
  fecha_pago INTEGER,             -- dia del mes para pago, NULL para debito
  color TEXT DEFAULT 'azul',      -- 'azul' | 'morado' | 'verde' | 'naranja'
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tarjetas" ON tarjetas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tarjetas" ON tarjetas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tarjetas" ON tarjetas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tarjetas" ON tarjetas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tarjetas_updated_at BEFORE UPDATE ON tarjetas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_tarjetas_user_id ON tarjetas(user_id);
CREATE INDEX idx_tarjetas_activa ON tarjetas(user_id, activa);
