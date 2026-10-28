CREATE TABLE public.categorias (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE CHECK (char_length(nome) BETWEEN 1 AND 80), oculto boolean NOT NULL DEFAULT false, ordem int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY categorias_read ON public.categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categorias_admin ON public.categorias FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.categorias (nome, ordem) SELECT n, row_number() OVER () FROM (SELECT DISTINCT categoria n FROM public.produtos UNION SELECT unnest(ARRAY['Decoração','Gaming','Geek','Utilidades','Religioso','Iluminação','Natal','Presentes','Escritório','Infantil','Pets','Cozinha','Personalizados'])) s ON CONFLICT DO NOTHING;