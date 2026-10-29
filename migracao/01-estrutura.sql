-- 3dTechStudio: estrutura completa do banco. Rode UMA vez no SQL Editor do projeto novo, antes de importar os dados.
BEGIN;
-- 0000_studio_catalog.sql
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE TABLE public.profiles (id uuid PRIMARY KEY, display_name text NOT NULL DEFAULT '', avatar_url text, preferences jsonb NOT NULL DEFAULT '{}');
GRANT SELECT,INSERT,UPDATE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_profile_read ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid());
CREATE POLICY own_profile_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK(id=auth.uid());
CREATE POLICY own_profile_update ON public.profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE TABLE public.produtos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL CHECK(length(nome) BETWEEN 1 AND 150), descricao text NOT NULL DEFAULT '', categoria text NOT NULL DEFAULT 'Decoração', preco numeric(10,2) NOT NULL DEFAULT 0 CHECK(preco>=0), imagens text[] NOT NULL DEFAULT '{}', video_url text, especificacoes jsonb NOT NULL DEFAULT '{}', destaque boolean NOT NULL DEFAULT false, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), materiais text[] NOT NULL DEFAULT ARRAY['PLA']::text[], modelo_3d text, cores jsonb NOT NULL DEFAULT '[{"nome":"Preto","hex":"#1A1A1A"},{"nome":"Branco","hex":"#F5F5F5"},{"nome":"Terracota","hex":"#C8553D"},{"nome":"Azul","hex":"#3B5BDB"},{"nome":"Verde","hex":"#7A9E87"}]'::jsonb);
GRANT SELECT ON public.produtos TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.produtos TO authenticated; GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalog_read ON public.produtos FOR SELECT TO anon,authenticated USING(ativo);
CREATE POLICY admin_products ON public.produtos FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.pedidos_sob_medida (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid, nome text NOT NULL, contato text NOT NULL, descricao text NOT NULL CHECK(length(descricao) BETWEEN 10 AND 2000), arquivo text, logo_arquivo text, dimensoes jsonb DEFAULT '{}', cor text NOT NULL DEFAULT 'Preto', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.pedidos_sob_medida TO authenticated; GRANT ALL ON public.pedidos_sob_medida TO service_role;
ALTER TABLE public.pedidos_sob_medida ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_read ON public.pedidos_sob_medida FOR SELECT TO authenticated USING(owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.pedidos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), codigo text NOT NULL DEFAULT substr(gen_random_uuid()::text,1,8), owner_id uuid, itens jsonb NOT NULL DEFAULT '[]'::jsonb, total numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'aguardando_pagamento' CHECK(status IN ('aguardando_pagamento','pago','em_producao','cancelado','enviado','entregue')), stripe_session_id text UNIQUE, email text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.pedidos TO authenticated; GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_owner_read ON public.pedidos FOR SELECT TO authenticated USING(owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.quote_rate_limits (key text PRIMARY KEY, last_submission timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.quote_rate_limits TO service_role;
ALTER TABLE public.quote_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.claim_quote_slot(client_key text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE accepted text; BEGIN INSERT INTO public.quote_rate_limits(key) VALUES(client_key) ON CONFLICT(key) DO UPDATE SET last_submission=now() WHERE quote_rate_limits.last_submission < now()-interval '30 seconds' RETURNING key INTO accepted; RETURN accepted IS NOT NULL; END $$;
REVOKE ALL ON FUNCTION public.claim_quote_slot(text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.claim_quote_slot(text) TO service_role;
CREATE POLICY media_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='product-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY media_admin_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='product-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY media_admin_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='product-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY media_catalog_read ON storage.objects FOR SELECT TO anon,authenticated USING(bucket_id='product-media' AND (EXISTS(SELECT 1 FROM public.produtos p WHERE p.ativo AND (name=ANY(p.imagens) OR name=p.video_url OR name=p.modelo_3d)) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY custom_upload ON storage.objects FOR INSERT TO anon,authenticated WITH CHECK(bucket_id='custom-models' AND name ~ '^[0-9a-f-]{36}\.(stl|obj|3mf|png|jpg|jpeg|webp|pdf)$');
CREATE POLICY custom_admin_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='custom-models' AND public.has_role(auth.uid(),'admin'));
-- 0002_pix_mercadopago_orders.sql
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS mp_payment_id text UNIQUE;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS metodo_pagamento text NOT NULL DEFAULT 'cartao';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS frete numeric NOT NULL DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS entrega jsonb;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS pagador jsonb;
-- 0003_catalog_comment.sql
COMMENT ON TABLE public.produtos IS '3DTech product catalog';
-- 0004_categorias.sql
CREATE TABLE public.categorias (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE CHECK (char_length(nome) BETWEEN 1 AND 80), oculto boolean NOT NULL DEFAULT false, ordem int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY categorias_read ON public.categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categorias_admin ON public.categorias FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.categorias (nome, ordem) SELECT n, row_number() OVER () FROM (SELECT DISTINCT categoria n FROM public.produtos UNION SELECT unnest(ARRAY['Decoração','Gaming','Geek','Utilidades','Religioso','Iluminação','Natal','Presentes','Escritório','Infantil','Pets','Cozinha','Personalizados'])) s ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets(id,name,public,file_size_limit) VALUES
 ('product-media','product-media',false,524288000),
 ('custom-models','custom-models',false,524288000)
ON CONFLICT (id) DO UPDATE SET public=EXCLUDED.public, file_size_limit=EXCLUDED.file_size_limit;
COMMIT;
