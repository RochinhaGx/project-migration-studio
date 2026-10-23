import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

async function validSignature(header: string, requestId: string, dataId: string, secret: string) {
  const parts = Object.fromEntries(header.split(',').map((p) => { const [k, ...v] = p.trim().split('='); return [k, v.join('=')]; }));
  const ts = parts['ts']; const v1 = parts['v1'];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest)));
  const expected = Array.from(mac).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

const bodySchema = z.object({ type: z.string().optional(), action: z.string().optional(), data: z.object({ id: z.union([z.string(), z.number()]) }).optional() }).passthrough();

export const Route = createFileRoute('/api/public/mercadopago/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const raw = await request.text();
        const parsed = bodySchema.safeParse(raw ? JSON.parse(raw) : {});
        const body = parsed.success ? parsed.data : {};
        const type = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
        const id = String(body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');
        if (type !== 'payment' || !/^\d{1,20}$/.test(id)) return new Response('ignored', { status: 200 });

        // Optional: when a webhook secret is configured, enforce Mercado Pago's signature.
        const secret = process.env['MERCADOPAGO_WEBHOOK_SECRET'];
        if (secret) {
          const sig = request.headers.get('x-signature'); const rid = request.headers.get('x-request-id') ?? '';
          if (!sig || !(await validSignature(sig, rid, id, secret))) return new Response('Invalid signature', { status: 401 });
        }

        // The payload's status is never trusted: the payment is re-read from Mercado Pago with our token.
        const { syncMpPayment } = await import('@/lib/mercadopago.server');
        try { await syncMpPayment(id); } catch { return new Response('retry', { status: 500 }); }
        return new Response('ok', { status: 200 });
      },
    },
  },
});
