CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    usaria_app INTEGER NOT NULL CHECK (usaria_app BETWEEN 1 AND 5),
    precio_mensual TEXT,
    que_mejorar TEXT,
    que_agregar TEXT,
    experiencia_general INTEGER CHECK (experiencia_general BETWEEN 1 AND 5),
    comentario TEXT,
    email_contacto TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own surveys"
    ON survey_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own surveys"
    ON survey_responses FOR SELECT
    USING (auth.uid() = user_id);
