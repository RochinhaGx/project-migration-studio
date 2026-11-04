import { checkoutItemSchema, validatedOrderItem } from './product-configuration';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { ORDER_STATUS } from './store-schema';
import { paymentOrigin } from './payment-origin';

const itemSchema = checkoutItemSchema;

export const createCheckout = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ items: z.array(itemSchema).min(1).max(50) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const req = getRequest();
    let owner: string | null = null; let email: string | undefined;
    const header = req.headers.get('authorization');
    if (header?.startsWith('Bearer ')) { const { data: u } = await supabaseAdmin.auth.getUser(header.slice(7)); owner = u.user?.id ?? null; email = u.user?.email ?? undefined; }
    const ids = [...new Set(data.items.map((i) => i.id))];
    const { data: rows, error } = await supabaseAdmin.from('produtos').select('id,nome,preco,materiais,cores,variacoes,personalizacao,ativo').in('id', ids).eq('ativo', true);
    if (error) throw new Error('Não foi possível conferir os produtos.');
    const itens = data.items.map((i) => {
      const p = rows?.find((r) => r.id === i.id);
      if (!p) throw new Error('Um produto da sacola não está mais disponível.');
      return validatedOrderItem(p, i);
    });
    const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    if (total < 1) throw new Error('Valor mínimo para pagamento online é R$ 1,00.');
    const { data: order, error: oe } = await supabaseAdmin.from('pedidos').insert({ owner_id: owner, itens, total, email: email ?? null }).select('id').single();
    if (oe || !order) throw new Error('Não foi possível registrar o pedido.');
    const origin = paymentOrigin(req.url, process.env['APP_URL']);
    const b = new URLSearchParams();
    b.set('mode', 'payment');
    b.set('success_url', `${origin}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`);
    b.set('cancel_url', `${origin}/sacola`);
    b.set('client_reference_id', order.id);
    b.set('metadata[pedido_id]', order.id);
    b.set('locale', 'pt-BR');
    if (email) b.set('customer_email', email);
    itens.forEach((i, n) => {
      b.set(`line_items[${n}][quantity]`, String(i.quantidade));
      b.set(`line_items[${n}][price_data][currency]`, 'brl');
      b.set(`line_items[${n}][price_data][unit_amount]`, String(Math.round(i.preco * 100)));
      b.set(`line_items[${n}][price_data][product_data][name]`, `${i.nome} · ${i.cor} · ${i.material}`.slice(0, 250));
    });
    const { stripeRequest } = await import('./stripe.server');
    const session = await stripeRequest('checkout/sessions', b, order.id);
    if (!session.url) throw new Error('Não foi possível abrir o pagamento.');
    const { error: saveError } = await supabaseAdmin.from('pedidos').update({ stripe_session_id: session.id }).eq('id', order.id);
    if (saveError) throw new Error('Não foi possível vincular o pagamento ao pedido.');
    return { url: session.url };
  });

export const confirmCheckout = createServerFn({ method: 'GET' })
  .inputValidator((d) => z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/) }).parse(d))
  .handler(async ({ data }) => {
    const { syncStripeSession } = await import('./stripe.server');
    return syncStripeSession(data.sessionId);
  });

export const adminOrders = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!role) throw new Error('Acesso não autorizado');
    const { data, error } = await context.supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) throw new Error('Não foi possível carregar os pedidos.');
    return data ?? [];
  });

export const updateOrderStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(Object.keys(ORDER_STATUS) as [keyof typeof ORDER_STATUS, ...(keyof typeof ORDER_STATUS)[]]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!role) throw new Error('Acesso não autorizado');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('pedidos').update({ status: data.status }).eq('id', data.id);
    if (error) throw new Error('Não foi possível atualizar o pedido.');
    return { ok: true };
  });
