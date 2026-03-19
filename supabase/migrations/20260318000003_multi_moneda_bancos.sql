-- Migration: multi_moneda_bancos
-- Creates catalog tables: monedas, paises, bancos
-- Adds banco_id, banco_custom, red, color to tarjetas
-- Adds pais_codigo to user_config

-- ============================================================
-- 1. MONEDAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monedas (
  codigo  TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  simbolo TEXT NOT NULL,
  activa  BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.monedas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read monedas" ON public.monedas FOR SELECT USING (true);

-- ============================================================
-- 2. PAISES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.paises (
  codigo        TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  moneda_codigo TEXT NOT NULL REFERENCES public.monedas(codigo),
  activo        BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.paises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read paises" ON public.paises FOR SELECT USING (true);

-- ============================================================
-- 3. BANCOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bancos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  pais_codigo TEXT NOT NULL REFERENCES public.paises(codigo),
  activo      BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read bancos" ON public.bancos FOR SELECT USING (true);

-- ============================================================
-- 4. SEEDS — MONEDAS
-- ============================================================
INSERT INTO public.monedas (codigo, nombre, simbolo) VALUES
  ('DOP', 'Peso Dominicano',     'RD$'),
  ('USD', 'Dólar Estadounidense','$'),
  ('EUR', 'Euro',                '€'),
  ('MXN', 'Peso Mexicano',       '$'),
  ('COP', 'Peso Colombiano',     '$'),
  ('ARS', 'Peso Argentino',      '$'),
  ('BRL', 'Real Brasileño',      'R$'),
  ('GBP', 'Libra Esterlina',     '£'),
  ('CAD', 'Dólar Canadiense',    '$'),
  ('CLP', 'Peso Chileno',        '$'),
  ('PEN', 'Sol Peruano',         'S/')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 5. SEEDS — PAISES
-- ============================================================
INSERT INTO public.paises (codigo, nombre, moneda_codigo) VALUES
  ('DO', 'República Dominicana', 'DOP'),
  ('US', 'Estados Unidos',       'USD'),
  ('ES', 'España',               'EUR'),
  ('MX', 'México',               'MXN'),
  ('CO', 'Colombia',             'COP'),
  ('AR', 'Argentina',            'ARS'),
  ('BR', 'Brasil',               'BRL'),
  ('GB', 'Reino Unido',          'GBP'),
  ('CA', 'Canadá',               'CAD'),
  ('CL', 'Chile',                'CLP'),
  ('PE', 'Perú',                 'PEN')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 6. SEEDS — BANCOS
-- ============================================================
INSERT INTO public.bancos (nombre, pais_codigo) VALUES
  -- República Dominicana
  ('Banco Popular Dominicano', 'DO'),
  ('BanReservas',              'DO'),
  ('Scotiabank RD',            'DO'),
  ('BHD León',                 'DO'),
  ('Banco Santa Cruz',         'DO'),
  -- Estados Unidos
  ('Chase',                    'US'),
  ('Bank of America',          'US'),
  ('Wells Fargo',              'US'),
  ('Citibank',                 'US'),
  ('Capital One',              'US'),
  -- México
  ('BBVA México',              'MX'),
  ('Citibanamex',              'MX'),
  ('Banorte',                  'MX'),
  ('HSBC México',              'MX'),
  ('Santander México',         'MX'),
  -- España
  ('Santander',                'ES'),
  ('BBVA',                     'ES'),
  ('CaixaBank',                'ES'),
  ('Banco Sabadell',           'ES'),
  -- Colombia
  ('Bancolombia',              'CO'),
  ('Banco de Bogotá',          'CO'),
  ('Davivienda',               'CO'),
  ('BBVA Colombia',            'CO'),
  -- Argentina
  ('Banco Nación',             'AR'),
  ('Banco Galicia',            'AR'),
  ('Santander Argentina',      'AR'),
  ('HSBC Argentina',           'AR'),
  -- Brasil
  ('Itaú',                     'BR'),
  ('Bradesco',                 'BR'),
  ('Banco do Brasil',          'BR'),
  ('Santander Brasil',         'BR'),
  ('Caixa Econômica Federal',  'BR'),
  -- Reino Unido
  ('Barclays',                 'GB'),
  ('HSBC UK',                  'GB'),
  ('Lloyds Bank',              'GB'),
  ('NatWest',                  'GB'),
  -- Canadá
  ('RBC Royal Bank',           'CA'),
  ('TD Bank',                  'CA'),
  ('Scotiabank',               'CA'),
  ('BMO Bank of Montreal',     'CA'),
  ('CIBC',                     'CA'),
  -- Chile
  ('Banco de Chile',           'CL'),
  ('BancoEstado',              'CL'),
  ('Santander Chile',          'CL'),
  ('BCI',                      'CL'),
  -- Perú
  ('BCP',                      'PE'),
  ('BBVA Perú',                'PE'),
  ('Interbank',                'PE'),
  ('Scotiabank Perú',          'PE');

-- ============================================================
-- 7. TARJETAS — nuevas columnas
-- ============================================================
ALTER TABLE public.tarjetas
  ADD COLUMN IF NOT EXISTS banco_id     UUID REFERENCES public.bancos(id),
  ADD COLUMN IF NOT EXISTS banco_custom TEXT;

-- red y color ya deberían existir según migración anterior, agregar si no:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tarjetas' AND column_name = 'red'
  ) THEN
    ALTER TABLE public.tarjetas ADD COLUMN red TEXT CHECK (red IN ('visa','mastercard','amex','discover','otro'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tarjetas' AND column_name = 'color'
  ) THEN
    ALTER TABLE public.tarjetas ADD COLUMN color TEXT;
  END IF;
END $$;

-- ============================================================
-- 8. USER_CONFIG — pais_codigo
-- ============================================================
ALTER TABLE public.user_config
  ADD COLUMN IF NOT EXISTS pais_codigo TEXT REFERENCES public.paises(codigo);

-- Ensure moneda column exists as TEXT (not ENUM)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_config' AND column_name = 'moneda'
  ) THEN
    ALTER TABLE public.user_config ADD COLUMN moneda TEXT NOT NULL DEFAULT 'DOP';
  END IF;
END $$;
