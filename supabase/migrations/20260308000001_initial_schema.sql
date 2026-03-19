-- ENUMs
CREATE TYPE IF NOT EXISTS tipo_categoria AS ENUM ('ingreso', 'egreso', 'ambos');
CREATE TYPE IF NOT EXISTS metodo_pago AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');
CREATE TYPE IF NOT EXISTS moneda AS ENUM ('DOP', 'USD');

-- Trigger function para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- user_config
CREATE TABLE IF NOT EXISTS user_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    moneda_principal moneda NOT NULL DEFAULT 'DOP',
    zona_horaria TEXT NOT NULL DEFAULT 'America/Santo_Domingo',
    notificaciones_activas BOOLEAN NOT NULL DEFAULT true,
    dia_inicio_semana INTEGER NOT NULL DEFAULT 1 CHECK (dia_inicio_semana BETWEEN 0 AND 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE TRIGGER update_user_config_updated_at BEFORE UPDATE ON user_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- categorias
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo tipo_categoria NOT NULL,
    icono TEXT,
    color TEXT,
    es_sistema BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria_id ON subcategorias(categoria_id);
CREATE TRIGGER update_subcategorias_updated_at BEFORE UPDATE ON subcategorias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ingresos
CREATE TABLE IF NOT EXISTS ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    subcategoria_id UUID REFERENCES subcategorias(id),
    monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
    moneda moneda NOT NULL DEFAULT 'DOP',
    descripcion TEXT,
    fuente TEXT,
    fecha DATE NOT NULL,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ingresos_user_id ON ingresos(user_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha);
CREATE INDEX IF NOT EXISTS idx_ingresos_categoria_id ON ingresos(categoria_id);
CREATE TRIGGER update_ingresos_updated_at BEFORE UPDATE ON ingresos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- egresos
CREATE TABLE IF NOT EXISTS egresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    subcategoria_id UUID REFERENCES subcategorias(id),
    monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
    moneda moneda NOT NULL DEFAULT 'DOP',
    descripcion TEXT,
    metodo_pago metodo_pago NOT NULL DEFAULT 'efectivo',
    fecha DATE NOT NULL,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_egresos_user_id ON egresos(user_id);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha);
CREATE INDEX IF NOT EXISTS idx_egresos_categoria_id ON egresos(categoria_id);
CREATE TRIGGER update_egresos_updated_at BEFORE UPDATE ON egresos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
