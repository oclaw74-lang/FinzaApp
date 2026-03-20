-- Seed: categorías de sistema para flujo de préstamos
-- Fix #6: egreso automático al pagar cuota (yo_debo)
-- Fix #8: ingreso automático al cobrar cuota (me_deben)

INSERT INTO categorias (nombre, tipo, icono, es_sistema) VALUES
    ('Pago de Préstamo',  'egreso',   'credit-card',  true),
    ('Cobro de Préstamo', 'ingreso',  'dollar-sign',  true)
ON CONFLICT DO NOTHING;
