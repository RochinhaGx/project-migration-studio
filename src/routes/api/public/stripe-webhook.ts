import { createFileRoute } from '@tanstack/react-router';

async function validSignature(raw: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(',').map((p) => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)]; }));
  const t = parts['t']; const sig = parts['v1'];
  if (!t || !sig || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${raw}`)));
  const expected = Array.from(mac).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute('/api/public/stripe-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['STRIPE_WEBHOOK_SECRET'];
        if (!secret) return new Response('Webhook not configured', { status: 500 });
        const raw = await request.text();
        const header = request.headers.get('stripe-signature');
        if (!header || !(await validSignature(raw, header, secret))) return new Response('Invalid signature', { status: 400 });
        const event = JSON.parse(raw) as { type: string; data: { object: { id: string; payment_status?: string; customer_details?: { email?: string } | null } } };
        const obj = event.data.object;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const paid = event.type === 'checkout.session.async_payment_succeeded' || (event.type === 'checkout.session.completed' && obj.payment_status === 'paid');
        const failed = event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired';
        if (paid) {
          const email = obj.customer_details?.email;
          await supabaseAdmin.from('pedidos').update({ status: 'pago', ...(email ? { email } : {}) }).eq('stripe_session_id', obj.id).eq('status', 'aguardando_pagamento');
        } else if (failed) {
          await supabaseAdmin.from('pedidos').update({ status: 'cancelado' }).eq('stripe_session_id', obj.id).eq('status', 'aguardando_pagamento');
        }
        return new Response('ok', { status: 200 });
      },
    },
  },
});
