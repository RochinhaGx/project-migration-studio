import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { estimateFreight, onlyDigits, orderStatusFromMp, payerSchema, pixFailureFromMp, type PixFailure } from './payment-rules';

const itemSchema = z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(99), color: z.string().max(40), material: z.enum(['PLA', 'PETG']) });

export const createPixPayment = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({
    items: z.array(itemSchema).min(1).max(50),
    payer: payerSchema,
    cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido.'),
    service: z.enum(['PAC', 'SEDEX']),
  }).parse(d))
  .handler(async ({ data }) => {
    const { mpRequest } = await import('./mercadopago.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const req = getRequest();

    const header = req.headers.get('authorization');
    let owner: string | null = null;
    if (header?.startsWith('Bearer ')) { const { data: u } = await supabaseAdmin.auth.getUser(header.slice(7)); owner = u.user?.id ?? null; }

    const ids = [...new Set(data.items.map((i) => i.id))];
    const { data: rows, error } = await supabaseAdmin.from('produtos').select('id,nome,preco,materiais,ativo').in('id', ids).eq('ativo', true);
    if (error) throw new Error('Não foi possível conferir os produtos.');
    const itens = data.items.map((i) => {
      const p = rows?.find((r) => r.id === i.id);
      if (!p) throw new Error('Um produto da sacola não está mais disponível.');
      if (!p.materiais.includes(i.material)) throw new Error(`Material indisponível para ${p.nome}.`);
      return { id: p.id, nome: p.nome, preco: Number(p.preco), quantidade: i.quantity, cor: i.color, material: i.material };
    });

    const ship = estimateFreight(data.cep)?.find((f) => f.service === data.service);
    if (!ship) throw new Error('CEP inválido para entrega.');
    const produtos = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const total = Math.round((produtos + ship.price) * 100) / 100;
    const cpf = onlyDigits(data.payer.cpf);

    const { data: order, error: oe } = await supabaseAdmin.from('pedidos').insert({
      owner_id: owner, itens, total, frete: ship.price, email: data.payer.email, metodo_pagamento: 'pix',
      entrega: { cep: onlyDigits(data.cep), servico: ship.service, prazo: ship.days },
      pagador: { nome: data.payer.nome, cpf },
    }).select('id,codigo').single();
    if (oe || !order) throw new Error('Não foi possível registrar o pedido.');

    const [first, ...rest] = data.payer.nome.trim().split(/\s+/);
    const origin = new URL(req.url).origin;
    const body: Record<string, unknown> = {
      transaction_amount: total,
      description: `Pedido 3D Tech Studio #${order.codigo.toUpperCase()}`,
      payment_method_id: 'pix',
      external_reference: order.id,
      payer: { email: data.payer.email, first_name: first, last_name: rest.join(' '), identification: { type: 'CPF', number: cpf } },
    };
    if (origin.startsWith('https://')) body['notification_url'] = `${origin}/api/public/mercadopago/webhook`;

    let payment;
    try {
      payment = await mpRequest('v1/payments', { method: 'POST', body, idempotencyKey: order.id });
    } catch (e) {
      await supabaseAdmin.from('pedidos').update({ status: 'cancelado' }).eq('id', order.id);
      throw e;
    }
    await supabaseAdmin.from('pedidos').update({ mp_payment_id: String(payment.id) }).eq('id', order.id);
    const tx = payment.point_of_interaction?.transaction_data;
    if (!tx?.qr_code || !tx.qr_code_base64) throw new Error('O Mercado Pago não retornou o QR Code. Tente novamente.');
    return { orderId: order.id, codigo: order.codigo.toUpperCase(), total, qrCode: tx.qr_code, qrCodeBase64: tx.qr_code_base64, expiresAt: payment.date_of_expiration ?? null };
  });

/** Public status check by unguessable order id; returns only status, failure reason, code and total. */
export const getPixStatus = createServerFn({ method: 'GET' })
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: o } = await supabaseAdmin.from('pedidos').select('id,codigo,total,status,mp_payment_id').eq('id', data.orderId).maybeSingle();
    if (!o) return { found: false as const, paid: false, status: null, motivo: null, checkFailed: false, codigo: null, total: 0 };
    let status = o.status;
    let motivo: PixFailure | null = null;
    let checkFailed = false;
    if ((status === 'aguardando_pagamento' || status === 'cancelado') && o.mp_payment_id) {
      const { syncMpPayment, mpRequest } = await import('./mercadopago.server');
      try {
        const p = status === 'aguardando_pagamento' ? await syncMpPayment(o.mp_payment_id) : await mpRequest(`v1/payments/${encodeURIComponent(o.mp_payment_id)}`);
        status = orderStatusFromMp(p.status) ?? status;
        motivo = pixFailureFromMp(p.status, p.status_detail, p.date_of_expiration);
      } catch { checkFailed = true; }
    }
    if (status === 'cancelado' && !motivo && !checkFailed) motivo = 'expirado';
    return { found: true as const, paid: status !== 'aguardando_pagamento' && status !== 'cancelado' && !motivo, status, motivo, checkFailed, codigo: o.codigo.toUpperCase(), total: Number(o.total) };
  });
