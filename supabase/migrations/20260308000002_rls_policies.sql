ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;

-- user_config policies
CREATE POLICY "user_config_select_own" ON user_config
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_config_insert_own" ON user_config
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_config_update_own" ON user_config
    FOR UPDATE USING (auth.uid() = user_id);

-- categorias policies (sistema visible para todos, propias solo el dueno)
CREATE POLICY "categorias_select" ON categorias
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "categorias_insert_own" ON categorias
    FOR INSERT WITH CHECK (auth.uid() = user_id AND es_sistema = false);
CREATE POLICY "categorias_update_own" ON categorias
    FOR UPDATE USING (auth.uid() = user_id AND es_sistema = false);
CREATE POLICY "categorias_delete_own" ON categorias
    FOR DELETE USING (auth.uid() = user_id AND es_sistema = false);

-- subcategorias policies
CREATE POLICY "subcategorias_select" ON subcategorias
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "subcategorias_insert_own" ON subcategorias
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subcategorias_update_own" ON subcategorias
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "subcategorias_delete_own" ON subcategorias
    FOR DELETE USING (auth.uid() = user_id);

-- ingresos policies
CREATE POLICY "ingresos_select_own" ON ingresos
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ingresos_insert_own" ON ingresos
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ingresos_update_own" ON ingresos
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ingresos_delete_own" ON ingresos
    FOR DELETE USING (auth.uid() = user_id);

-- egresos policies
CREATE POLICY "egresos_select_own" ON egresos
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "egresos_insert_own" ON egresos
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "egresos_update_own" ON egresos
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "egresos_delete_own" ON egresos
    FOR DELETE USING (auth.uid() = user_id);
