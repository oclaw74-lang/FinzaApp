-- Add English content columns to lecciones
ALTER TABLE lecciones ADD COLUMN IF NOT EXISTS titulo_en TEXT;
ALTER TABLE lecciones ADD COLUMN IF NOT EXISTS descripcion_corta_en TEXT;
ALTER TABLE lecciones ADD COLUMN IF NOT EXISTS contenido_json_en JSONB;

-- Lesson 1: El presupuesto 50/30/20
UPDATE lecciones SET
  titulo_en = 'The 50/30/20 Budget',
  descripcion_corta_en = 'Learn to distribute your income with the most popular rule',
  contenido_json_en = '{"hook":"Most people spend without a plan","concept":"Divide your income: 50% needs, 30% wants, 20% savings","action":"Review your last month''s expenses and classify them into these 3 categories","tip":"Finza already calculates your balance automatically — use it as a starting point"}'
WHERE titulo = 'El presupuesto 50/30/20';

-- Lesson 2: Fondo de emergencia
UPDATE lecciones SET
  titulo_en = 'Emergency Fund',
  descripcion_corta_en = 'Why you need 3 months of expenses saved',
  contenido_json_en = '{"hook":"65% of people could not cover an unexpected $5,000 expense","concept":"An emergency fund prevents financial crises from turning into debt","action":"Calculate your average monthly expenses and set your goal in Finza","tip":"Start with 1 month of expenses and grow gradually"}'
WHERE titulo = 'Fondo de emergencia';

-- Lesson 3: Como salir de deudas
UPDATE lecciones SET
  titulo_en = 'How to Get Out of Debt',
  descripcion_corta_en = 'Avalanche method vs snowball method',
  contenido_json_en = '{"hook":"High-interest debts can double in 5 years","concept":"Avalanche: pay highest-interest debt first. Snowball: pay smallest debt first","action":"List your loans in Finza and calculate the monthly interest cost","tip":"Finza shows you the real cost of your debts in the comparison view"}'
WHERE titulo = 'Como salir de deudas';

-- Lesson 4: Invierte el 10%
UPDATE lecciones SET
  titulo_en = 'Invest 10%',
  descripcion_corta_en = 'The habit with the biggest impact on your financial future',
  contenido_json_en = '{"hook":"Investing $1,000 monthly for 20 years can generate over $600,000","concept":"Consistent investing beats perfect investing thanks to compound interest","action":"Set up a savings goal in Finza and enable automatic transfer","tip":"Start with just 1% — the habit matters more than the amount"}'
WHERE titulo = 'Invierte el 10%';

-- Lesson 5: Gastos hormiga
UPDATE lecciones SET
  titulo_en = 'Micro-Expenses',
  descripcion_corta_en = 'The small expenses eating away at your savings',
  contenido_json_en = '{"hook":"A $150 daily coffee adds up to $54,000 a year","concept":"Small, frequent expenses are hard to notice but add up to a huge amount","action":"Enable the impulse spending detector in Finza and review your last month patterns","tip":"It''s not about eliminating all pleasures — it''s about deciding consciously"}'
WHERE titulo = 'Gastos hormiga';
