-- =============================================================
-- Fix #19 / #20: Add fecha_cobro to profiles
-- Fix #21: Web Push subscriptions table
-- Issue #149
-- =============================================================

-- profiles: día del mes en que el usuario recibe su salario (1-31)
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS fecha_cobro SMALLINT
        CHECK (fecha_cobro IS NULL OR (fecha_cobro >= 1 AND fecha_cobro <= 31));

-- Web Push subscriptions (Fix #21)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint     TEXT NOT NULL UNIQUE,
    p256dh       TEXT NOT NULL,
    auth         TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own"
    ON push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert_own"
    ON push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own"
    ON push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
    ON push_subscriptions(user_id);
