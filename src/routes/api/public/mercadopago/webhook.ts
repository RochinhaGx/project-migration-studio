import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { verifyMercadoPagoSignature } from '@/lib/webhook-signatures';
const bodySchema = z.object({ type: z.string().max(80).optional(), action: z.string().max(120).optional(), data: z.object({ id: z.union([z.string().regex(/^\d{1,20}$/), z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)]) }).optional() }).passthrough();

export const Route = createFileRoute('/api/public/mercadopago/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const raw = await request.text();
        if (raw.length > 1024 * 1024) return new Response('Too large', { status: 413 });
        let payload: unknown;
        try { payload = raw ? JSON.parse(raw) : {}; } catch { return new Response('Invalid JSON', { status: 400 }); }
        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) return new Response('Invalid event', { status: 400 });
        const body = parsed.data;
        const type = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
        const queryId = url.searchParams.get('data.id') ?? url.searchParams.get('id');
        const id = String(queryId ?? body.data?.id ?? '');
        if (queryId && body.data?.id !== undefined && queryId !== String(body.data.id)) return new Response('Mismatched payment', { status: 400 });
        if (type !== 'payment' || !/^\d{1,20}$/.test(id)) return new Response('ignored', { status: 200 });

        // Never allow unsigned notifications to trigger privileged writes.
        const secret = process.env['MERCADOPAGO_WEBHOOK_SECRET'];
        if (!secret) return new Response('Webhook not configured', { status: 503 });
        const sig = request.headers.get('x-signature'); const rid = request.headers.get('x-request-id') ?? '';
        if (!sig || !(await verifyMercadoPagoSignature(sig, rid, id, secret))) return new Response('Invalid signature', { status: 401 });

        // The payload's status is never trusted: the payment is re-read from Mercado Pago with our token.
        const { syncMpPayment } = await import('@/lib/mercadopago.server');
        try { await syncMpPayment(id); } catch { return new Response('retry', { status: 500 }); }
        return new Response('ok', { status: 200 });
      },
    },
  },
});
