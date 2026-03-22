-- Add moneda column to recurrentes
-- Existing rows default to 'DOP' for backwards compatibility.
-- The currency is always one of the user's configured currencies
-- (moneda_principal or moneda_secundaria from user_config).

ALTER TABLE recurrentes
  ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'DOP';
