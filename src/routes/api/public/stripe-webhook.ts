import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { verifyStripeSignature } from '@/lib/webhook-signatures';
const eventSchema = z.object({ type: z.string().min(1).max(120), data: z.object({ object: z.object({ id: z.string().min(1).max(255) }) }) });

export const Route = createFileRoute('/api/public/stripe-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['STRIPE_WEBHOOK_SECRET'];
        if (!secret) return new Response('Webhook not configured', { status: 500 });
        const raw = await request.text();
        if (raw.length > 1024 * 1024) return new Response('Too large', { status: 413 });
        const header = request.headers.get('stripe-signature');
        if (!header || !(await verifyStripeSignature(raw, header, secret))) return new Response('Invalid signature', { status: 400 });
        let payload: unknown;
        try { payload = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400 }); }
        const event = eventSchema.safeParse(payload);
        if (!event.success) return new Response('Invalid event', { status: 400 });
        if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.data.type)) return new Response('ignored');
        const id = event.data.data.object.id;
        if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return new Response('Invalid session', { status: 400 });
        const { syncStripeSession } = await import('@/lib/stripe.server');
        try { await syncStripeSession(id); } catch { return new Response('retry', { status: 500 }); }
        return new Response('ok', { status: 200 });
      },
    },
  },
});
