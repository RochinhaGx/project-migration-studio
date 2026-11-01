import { orderStatusFromMp } from './payment-rules';
import { paymentMatchesOrder } from './webhook-signatures';

type MpPayment = {
  id: number;
  status: string;
  status_detail?: string | null;
  external_reference?: string | null;
  transaction_amount?: number;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } };
  date_of_expiration?: string | null;
};

export async function mpRequest<T = MpPayment>(path: string, init?: { method?: string; body?: unknown; idempotencyKey?: string }): Promise<T> {
  const token = process.env['MERCADOPAGO_ACCESS_TOKEN'];
  if (!token) throw new Error('Pix indisponível no momento.');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (init?.idempotencyKey) headers['X-Idempotency-Key'] = init.idempotencyKey;
  const res = await fetch(`https://api.mercadopago.com/${path}`, { method: init?.method ?? 'GET', headers, body: init?.body ? JSON.stringify(init.body) : null });
  const json = (await res.json().catch(() => ({}))) as T & { message?: string; cause?: unknown };
  if (!res.ok) {
    console.error('Mercado Pago', res.status, json.message, JSON.stringify(json.cause ?? ''));
    throw new Error('Não foi possível processar o Pix agora. Tente novamente.');
  }
  return json;
}

/** Re-reads the payment from Mercado Pago (never trusting a caller's payload) and stores the resulting order status. */
export async function syncMpPayment(paymentId: string) {
  const payment = await mpRequest(`v1/payments/${encodeURIComponent(paymentId)}`);
  const next = orderStatusFromMp(payment.status);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: order, error } = await supabaseAdmin.from('pedidos').select('id,total,status').eq('mp_payment_id', String(payment.id)).maybeSingle();
  if (error) throw new Error('Não foi possível conferir o pedido.');
  if (!order) return payment;
  if (String(payment.id) !== paymentId || !paymentMatchesOrder(payment.external_reference, payment.transaction_amount, order)) throw new Error('Pix não corresponde ao pedido.');
  if (next && order.status === 'aguardando_pagamento') {
    const { error: updateError } = await supabaseAdmin.from('pedidos').update({ status: next }).eq('id', order.id).eq('status', 'aguardando_pagamento');
    if (updateError) throw new Error('Não foi possível confirmar o Pix.');
  }
  return payment;
}

export type { MpPayment };
