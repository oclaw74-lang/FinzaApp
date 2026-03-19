-- Add English content to retos table
ALTER TABLE retos ADD COLUMN IF NOT EXISTS titulo_en TEXT;
ALTER TABLE retos ADD COLUMN IF NOT EXISTS descripcion_en TEXT;

UPDATE retos SET titulo_en = 'No coffee outside', descripcion_en = 'Don''t buy coffee at any establishment for 7 days' WHERE titulo = 'Sin cafe fuera de casa';
UPDATE retos SET titulo_en = 'No delivery week', descripcion_en = 'Cook at home every day this week' WHERE titulo = 'Semana sin delivery';
UPDATE retos SET titulo_en = 'Month without impulse buying', descripcion_en = 'Avoid unplanned purchases for 30 days' WHERE titulo = 'Mes sin compras impulsivas';
UPDATE retos SET titulo_en = 'Save an extra 10%', descripcion_en = 'Deposit an additional 10% of your income into your emergency fund' WHERE titulo = 'Ahorra el 10% extra';
UPDATE retos SET titulo_en = 'Daily expense review', descripcion_en = 'Record all your expenses for 7 consecutive days' WHERE titulo = 'Revision diaria de gastos';
UPDATE retos SET titulo_en = 'The 24-hour rule', descripcion_en = 'Before buying something non-essential, wait 24 hours to decide if you really need it' WHERE titulo = 'Regla de las 24 horas';
UPDATE retos SET titulo_en = 'No restaurants this week', descripcion_en = 'Bring your lunch and prepare your dinners at home for 7 consecutive days' WHERE titulo = 'Sin restaurantes esta semana';
UPDATE retos SET titulo_en = 'Cancel an unnecessary subscription', descripcion_en = 'Review your active subscriptions and cancel at least one you don''t use regularly' WHERE titulo = 'Elimina una suscripcion innecesaria';
UPDATE retos SET titulo_en = 'No credit card week', descripcion_en = 'Pay for everything with cash or transfer this week to be more conscious of your spending' WHERE titulo = 'Semana sin tarjeta de credito';
UPDATE retos SET titulo_en = 'Contribute to your savings goal', descripcion_en = 'Make at least one contribution to each of your active savings goals this week' WHERE titulo = 'Aporta a tu meta de ahorro';
