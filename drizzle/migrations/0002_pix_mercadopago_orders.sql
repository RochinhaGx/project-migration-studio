ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS mp_payment_id text UNIQUE;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS metodo_pagamento text NOT NULL DEFAULT 'cartao';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS frete numeric NOT NULL DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS entrega jsonb;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS pagador jsonb;