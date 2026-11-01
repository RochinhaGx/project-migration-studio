import { paymentMatchesOrder } from './webhook-signatures';
type StripeSession = { id: string; url: string | null; payment_status: string; status?: string; currency: string | null; amount_total: number | null; client_reference_id: string | null; customer_details?: { email?: string } | null };
export async function stripeRequest(path: string, body?: URLSearchParams, idempotencyKey?: string): Promise<StripeSession> {
  const key = process.env['STRIPE_RESTRICTED_API_KEY'];
  if (!key) throw new Error('Pagamento indisponível no momento.');
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) }, body: body ?? null });
  if (!response.ok) throw new Error('Não foi possível conferir o pagamento com cartão.');
  return response.json();
}
export async function syncStripeSession(sessionId: string) {
  const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: order, error } = await supabaseAdmin.from('pedidos').select('id,total,status').eq('stripe_session_id', sessionId).maybeSingle();
  if (error) throw new Error('Não foi possível conferir o pedido.');
  if (!order) return { paid: false, pedido: null };
  if (session.id !== sessionId || session.currency !== 'brl' || !paymentMatchesOrder(session.client_reference_id, typeof session.amount_total === 'number' ? session.amount_total / 100 : null, order)) throw new Error('Pagamento não corresponde ao pedido.');
  const paid = session.payment_status === 'paid';
  const next = paid ? 'pago' : session.status === 'expired' ? 'cancelado' : null;
  if (next && order.status === 'aguardando_pagamento') {
    const { error: updateError } = await supabaseAdmin.from('pedidos').update({ status: next, ...(paid && session.customer_details?.email ? { email: session.customer_details.email } : {}) }).eq('id', order.id).eq('status', 'aguardando_pagamento');
    if (updateError) throw new Error('Não foi possível confirmar o pedido.');
  }
  const { data: current, error: readError } = await supabaseAdmin.from('pedidos').select('id,total,status').eq('id', order.id).single();
  if (readError || !current) throw new Error('Não foi possível conferir o pedido.');
  return { paid, pedido: { codigo: current.id.slice(0, 8).toUpperCase(), total: Number(current.total), status: current.status } };
}