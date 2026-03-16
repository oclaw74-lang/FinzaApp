ALTER TABLE egresos ADD COLUMN IF NOT EXISTS is_impulso BOOLEAN DEFAULT NULL;
ALTER TABLE egresos ADD COLUMN IF NOT EXISTS impulso_clasificado BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_egresos_is_impulso ON egresos(user_id, is_impulso);
