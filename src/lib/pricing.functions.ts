import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { DEFAULT_PRICING, type PricingConfig } from './pricing';

const pricingSchema = z.object({
  custo_filamento_kg: z.coerce.number().min(0).max(100000),
  custo_energia_kwh: z.coerce.number().min(0).max(1000),
  potencia_w: z.coerce.number().min(0).max(100000),
  custo_hora_maquina: z.coerce.number().min(0).max(10000),
  taxa_falha: z.coerce.number().min(0).max(1),
  margem: z.literal(1.9),
});

function publicClient() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Configuração indisponível');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers }); } } });
}

/** Configuração pública da calculadora de preços; cai nos valores padrão quando não há linha salva. */
export const getPricingConfig = createServerFn({ method: 'GET' }).handler(async (): Promise<PricingConfig> => {
  const client = publicClient();
  const { data } = await client.from('config_loja').select('valor').eq('key', 'precificacao').maybeSingle();
  const parsed = pricingSchema.safeParse(data?.valor);
  return parsed.success ? parsed.data : DEFAULT_PRICING;
});

export const savePricingConfig = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => pricingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!role) throw new Error('Acesso não autorizado');
    const { error } = await context.supabase.from('config_loja').upsert({ key: 'precificacao', valor: data, updated_at: new Date().toISOString() });
    if (error) throw new Error('Não foi possível salvar a precificação.');
    return { ok: true };
  });
