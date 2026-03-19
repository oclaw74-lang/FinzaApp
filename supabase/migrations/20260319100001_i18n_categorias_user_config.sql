-- Add English name to categorias
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS nombre_en TEXT;

-- Populate English names for system categories
UPDATE categorias SET nombre_en = 'Salary' WHERE nombre = 'Salario' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Freelance' WHERE nombre = 'Freelance' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Investments' WHERE nombre = 'Inversiones' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Sales' WHERE nombre = 'Ventas' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Other Income' WHERE nombre = 'Otros Ingresos' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Food' WHERE nombre = 'Alimentacion' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Transport' WHERE nombre = 'Transporte' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Housing' WHERE nombre = 'Vivienda' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Services' WHERE nombre = 'Servicios' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Health' WHERE nombre = 'Salud' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Education' WHERE nombre = 'Educacion' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Entertainment' WHERE nombre = 'Entretenimiento' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Clothing' WHERE nombre = 'Ropa' AND es_sistema = true;
UPDATE categorias SET nombre_en = 'Other Expenses' WHERE nombre = 'Otros Egresos' AND es_sistema = true;

-- Add language field to user_config
ALTER TABLE user_config ADD COLUMN IF NOT EXISTS idioma TEXT NOT NULL DEFAULT 'es';
