-- Seed: 14 categorias del sistema (user_id = NULL)

-- Categorias de INGRESO (5)
INSERT INTO categorias (nombre, tipo, icono, es_sistema) VALUES
    ('Salario', 'ingreso', 'briefcase', true),
    ('Freelance', 'ingreso', 'laptop', true),
    ('Inversiones', 'ingreso', 'trending-up', true),
    ('Ventas', 'ingreso', 'shopping-bag', true),
    ('Otros Ingresos', 'ingreso', 'plus-circle', true)
ON CONFLICT DO NOTHING;

-- Categorias de EGRESO (9)
INSERT INTO categorias (nombre, tipo, icono, es_sistema) VALUES
    ('Alimentacion', 'egreso', 'utensils', true),
    ('Transporte', 'egreso', 'car', true),
    ('Vivienda', 'egreso', 'home', true),
    ('Servicios', 'egreso', 'zap', true),
    ('Salud', 'egreso', 'heart', true),
    ('Educacion', 'egreso', 'book', true),
    ('Entretenimiento', 'egreso', 'film', true),
    ('Ropa', 'egreso', 'shirt', true),
    ('Otros Egresos', 'egreso', 'more-horizontal', true)
ON CONFLICT DO NOTHING;

-- Subcategorias de Alimentacion
INSERT INTO subcategorias (categoria_id, nombre)
SELECT id, sub.nombre FROM categorias, (VALUES
    ('Supermercado'),
    ('Restaurantes'),
    ('Delivery')
) AS sub(nombre)
WHERE nombre = 'Alimentacion' AND es_sistema = true
ON CONFLICT DO NOTHING;

-- Subcategorias de Transporte
INSERT INTO subcategorias (categoria_id, nombre)
SELECT id, sub.nombre FROM categorias, (VALUES
    ('Combustible'),
    ('Transporte Publico'),
    ('Taxi/Uber')
) AS sub(nombre)
WHERE nombre = 'Transporte' AND es_sistema = true
ON CONFLICT DO NOTHING;

-- Subcategorias de Vivienda
INSERT INTO subcategorias (categoria_id, nombre)
SELECT id, sub.nombre FROM categorias, (VALUES
    ('Alquiler'),
    ('Hipoteca'),
    ('Mantenimiento')
) AS sub(nombre)
WHERE nombre = 'Vivienda' AND es_sistema = true
ON CONFLICT DO NOTHING;

-- Subcategorias de Servicios
INSERT INTO subcategorias (categoria_id, nombre)
SELECT id, sub.nombre FROM categorias, (VALUES
    ('Electricidad'),
    ('Agua'),
    ('Internet'),
    ('Telefono')
) AS sub(nombre)
WHERE nombre = 'Servicios' AND es_sistema = true
ON CONFLICT DO NOTHING;
