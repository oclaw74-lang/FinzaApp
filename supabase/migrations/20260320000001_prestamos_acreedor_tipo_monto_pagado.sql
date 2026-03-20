-- Fix #145: Add acreedor_tipo and monto_ya_pagado columns to prestamos table

ALTER TABLE prestamos
    ADD COLUMN IF NOT EXISTS acreedor_tipo TEXT NOT NULL DEFAULT 'persona'
        CHECK (acreedor_tipo IN ('persona', 'banco')),
    ADD COLUMN IF NOT EXISTS monto_ya_pagado NUMERIC(15,2) NOT NULL DEFAULT 0
        CHECK (monto_ya_pagado >= 0);

COMMENT ON COLUMN prestamos.acreedor_tipo IS 'Whether the lender is a person or a bank';
COMMENT ON COLUMN prestamos.monto_ya_pagado IS 'Amount already paid before registering the loan (for historical loans)';
