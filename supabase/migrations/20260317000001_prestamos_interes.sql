-- Add interest rate and loan term to prestamos (already applied manually)
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS tasa_interes DECIMAL(5,2);
ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS plazo_meses INTEGER;
