-- Fix tarjetas table constraints and optional fields
-- Keeps banco + titular columns, just relaxes constraints

DO $$
BEGIN
  -- Only run if tarjetas table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tarjetas') THEN

    -- Fix red constraint: add 'discover' and 'otro' (was 'otra')
    ALTER TABLE tarjetas DROP CONSTRAINT IF EXISTS tarjetas_red_check;
    ALTER TABLE tarjetas ADD CONSTRAINT tarjetas_red_check
      CHECK (red IN ('visa', 'mastercard', 'amex', 'discover', 'otro'));

    -- Make titular nullable (auto-filled by backend from user email)
    ALTER TABLE tarjetas ALTER COLUMN titular DROP NOT NULL;

    -- Make color nullable and drop fixed default 'azul'
    ALTER TABLE tarjetas ALTER COLUMN color DROP DEFAULT;
    ALTER TABLE tarjetas ALTER COLUMN color TYPE TEXT;
    ALTER TABLE tarjetas ALTER COLUMN color DROP NOT NULL;

    -- Ensure activa has default true
    ALTER TABLE tarjetas ALTER COLUMN activa SET DEFAULT true;

  END IF;
END $$;
