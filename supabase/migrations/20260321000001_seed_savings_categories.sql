-- Seed: 2 categorias del sistema para transacciones de ahorro y fondo de emergencia
-- 'Ahorro / Metas' (egreso)  — se usa cuando el usuario abona a una meta o al fondo de emergencia
-- 'Retiro de Ahorro' (ingreso) — se usa cuando el usuario retira de una meta o del fondo de emergencia

INSERT INTO categorias (nombre, tipo, icono, es_sistema) VALUES
    ('Ahorro / Metas',    'egreso',  'piggy-bank', true),
    ('Retiro de Ahorro',  'ingreso', 'wallet',      true)
ON CONFLICT DO NOTHING;
