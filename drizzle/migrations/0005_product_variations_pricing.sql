ALTER TABLE public.produtos
  ADD COLUMN variacoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN personalizacao jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN producao jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.produtos.variacoes IS 'Tamanhos e opcoes com precos proprios: { tamanhos: [{nome, altura, largura, profundidade, preco}] }';
COMMENT ON COLUMN public.produtos.personalizacao IS 'Opcoes de personalizacao: { ativo, texto, medidas, upload, extras: [{nome, preco}] }';
COMMENT ON COLUMN public.produtos.producao IS 'Dados de fabricacao: { peso_g, tempo_min, custo_extra } — nunca inventar peso/tempo';

CREATE TABLE public.config_loja (
  key text PRIMARY KEY,
  valor jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.config_loja TO anon;
GRANT SELECT ON public.config_loja TO authenticated;
GRANT ALL ON public.config_loja TO service_role;

ALTER TABLE public.config_loja ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_read ON public.config_loja FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY config_admin_write ON public.config_loja FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.config_loja (key, valor) VALUES (
  'precificacao',
  '{"custo_filamento_kg": 120, "custo_energia_kwh": 0.9, "potencia_w": 150, "custo_hora_maquina": 0.5, "taxa_falha": 0.1, "margem": 1.9}'::jsonb
);