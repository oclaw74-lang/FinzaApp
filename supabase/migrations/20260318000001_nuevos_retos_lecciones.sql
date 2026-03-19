-- Migration: 20260318000001_nuevos_retos_lecciones
-- Description: Add new retos and lecciones for improved financial education
-- NOTE: Uses WHERE NOT EXISTS to be idempotent (safe to run multiple times)

-- =============================================
-- NUEVOS RETOS
-- =============================================
INSERT INTO retos (id, titulo, descripcion, tipo, ahorro_estimado, icono)
SELECT gen_random_uuid(), titulo, descripcion, tipo, ahorro_estimado, icono
FROM (VALUES
  ('Regla de las 24 horas', 'Antes de comprar algo no esencial, espera 24 horas para decidir si realmente lo necesitas', 'semanal', 1500.00, '⏰'),
  ('Sin restaurantes esta semana', 'Lleva tu almuerzo y prepara tus cenas en casa durante 7 días consecutivos', 'semanal', 2000.00, '🍱'),
  ('Elimina una suscripción innecesaria', 'Revisa tus suscripciones activas y cancela al menos una que no uses regularmente', 'mensual', 500.00, '✂️'),
  ('Semana sin tarjeta de crédito', 'Paga todo con efectivo o transferencia esta semana para ser más consciente de tus gastos', 'semanal', 3000.00, '💳'),
  ('Aporta a tu meta de ahorro', 'Haz al menos una contribución a cada una de tus metas activas esta semana', 'semanal', 0.00, '🎯'),
  ('Investiga antes de comprar', 'Por cada compra mayor a RD$500, compara precios en al menos 2 lugares antes de decidir', 'semanal', 1000.00, '🔍')
) AS v(titulo, descripcion, tipo, ahorro_estimado, icono)
WHERE NOT EXISTS (SELECT 1 FROM retos r WHERE r.titulo = v.titulo);

-- =============================================
-- NUEVAS LECCIONES
-- =============================================
INSERT INTO lecciones (id, titulo, descripcion_corta, contenido_json, nivel, duracion_minutos, orden)
SELECT gen_random_uuid(), titulo, descripcion_corta, contenido_json::jsonb, nivel, duracion_minutos, orden
FROM (VALUES
  (
    'La regla de las 24 horas',
    'El truco más simple para evitar compras por impulso',
    '{"hook": "¿Cuántas veces compraste algo que luego no necesitabas? El 40% de las compras son impulsivas.", "concept": "La regla de las 24 horas dice: si quieres comprar algo no esencial, espera un día. Si al día siguiente todavía lo quieres y puedes pagarlo sin afectar tu presupuesto, cómpralo. Esta simple pausa elimina el 90% de las compras impulsivas.", "action": "Activa el reto Regla de las 24 horas en Finza y registra cada vez que esperaste antes de comprar algo.", "tip": "Usa Finza para ver tus gastos marcados como impulsivos. Si hay muchos, la regla de las 24 horas puede ahorrarte miles al mes."}',
    'control', 3, 6
  ),
  (
    'Deuda buena vs deuda mala',
    'No toda deuda es igual: aprende cuándo endeudarte tiene sentido',
    '{"hook": "¿Sabías que pedir un préstamo puede ser una de las mejores decisiones financieras... o de las peores? Todo depende de para qué lo usas.", "concept": "Deuda buena genera valor o ingreso futuro: educación, negocio, vivienda. Deuda mala financia consumo que se deprecia rápido: ropa, vacaciones, electrónicos con tarjeta al máximo. La clave es comparar la tasa de interés que pagas vs el retorno que esperas obtener.", "action": "Revisa tus préstamos activos en Finza. Para cada uno pregúntate: ¿esto me generará más valor del que me cuesta en intereses?", "tip": "En Finza puedes ver la tasa de interés de cada préstamo y calcular cuánto pagas en total. Prioriza liquidar primero los de mayor tasa."}',
    'control', 4, 7
  ),
  (
    'El interés compuesto: tu mejor aliado',
    'Por qué empezar a ahorrar hoy vale más que esperar a mañana',
    '{"hook": "Einstein llamó al interés compuesto la octava maravilla del mundo. El que lo entiende lo gana. El que no, lo paga.", "concept": "El interés compuesto significa ganar interés sobre tu interés. RD$10,000 al 10% anual durante 20 años = RD$67,275. Durante 30 años = RD$174,494. El tiempo es más poderoso que el monto inicial. Cada año que esperas para empezar te cuesta exponencialmente más.", "action": "Crea una meta de ahorro a largo plazo en Finza (5+ años). Aunque sea pequeña, empieza hoy. El tiempo es tu activo más valioso.", "tip": "Cada mes que esperas para empezar a ahorrar te cuesta más de lo que crees. Una meta activa en Finza te ayuda a mantener el hábito y ver tu progreso real."}',
    'crecimiento', 4, 8
  ),
  (
    'Gastos hormiga: el enemigo invisible',
    'Los pequeños gastos diarios que destrozan silenciosamente tu presupuesto',
    '{"hook": "RD$150 en café todos los días = RD$54,750 al año. ¿Te parece mucho? La mayoría no lo ve porque son gastos pequeños y frecuentes.", "concept": "Los gastos hormiga son compras pequeñas y habituales que parecen insignificantes individualmente pero se acumulan en cantidades enormes. El problema no es el gasto en sí, sino el patrón repetido sin consciencia. Identificarlos es el primer paso para controlarlos.", "action": "Revisa tus egresos en Finza del último mes. Identifica los gastos más frecuentes. ¿Cuánto suman en total? ¿Todos valen realmente lo que cuestan?", "tip": "Finza organiza tus egresos por categoría automáticamente. Filtra por Alimentación o Entretenimiento para descubrir tus gastos hormiga más costosos."}',
    'fundamentos', 3, 9
  ),
  (
    'Define metas financieras que sí puedes lograr',
    'El método SMART aplicado a tus finanzas personales',
    '{"hook": "El 80% de las personas con metas financieras vagas nunca las logran. El problema no es la falta de voluntad: es la falta de claridad.", "concept": "Una meta SMART es Específica (¿cuánto exactamente?), Medible (¿cómo sabes que avanzas?), Alcanzable (¿es realista con tus ingresos actuales?), Relevante (¿por qué importa para ti?) y Temporal (¿cuándo exactamente la lograrás?). Ahorrar más no es SMART. Ahorrar RD$50,000 para diciembre 2026 aportando RD$4,000 mensuales sí lo es.", "action": "Revisa tus metas activas en Finza. ¿Tienen fecha objetivo? ¿El monto es específico? Edítalas para que sean SMART y activa recordatorios.", "tip": "Finza calcula automáticamente cuánto necesitas aportar mensualmente para alcanzar tu meta a tiempo. Úsalo para ajustar tus metas y hacerlas más realistas."}',
    'fundamentos', 3, 10
  )
) AS v(titulo, descripcion_corta, contenido_json, nivel, duracion_minutos, orden)
WHERE NOT EXISTS (SELECT 1 FROM lecciones l WHERE l.titulo = v.titulo);
