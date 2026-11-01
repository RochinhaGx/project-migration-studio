// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { paymentMatchesOrder, verifyStripeSignature, verifyMercadoPagoSignature } from '@/lib/webhook-signatures';
import { paymentOrigin, usesManagedGoogle } from '@/lib/payment-origin';
const fixture = 'test-only-signing-fixture';
const sign = (value: string) => createHmac('sha256', fixture).update(value).digest('hex');
describe('Payment webhook security', () => {
  it('accepts a signed Stripe event including a rotated signature', async () => {
    expect(await verifyStripeSignature('{}', `t=1000,v1=${'0'.repeat(64)},v1=${sign('1000.{}')}`, fixture, 1000000)).toBe(true);
  });
  it('rejects a tampered Stripe event and expired signature', async () => {
    expect(await verifyStripeSignature('{"changed":true}', `t=1000,v1=${sign('1000.{}')}`, fixture, 1000000)).toBe(false);
    expect(await verifyStripeSignature('{}', `t=1000,v1=${sign('1000.{}')}`, fixture, 1301000)).toBe(false);
  });
  it('accepts Mercado Pago only for the signed request and payment', async () => {
    const header = `ts=1000,v1=${sign('id:123;request-id:req-1;ts:1000;')}`;
    expect(await verifyMercadoPagoSignature(header, 'req-1', '123', fixture)).toBe(true);
    expect(await verifyMercadoPagoSignature(header, 'req-1', '456', fixture)).toBe(false);
    expect(await verifyMercadoPagoSignature(header, '', '123', fixture)).toBe(false);
  });
  it('rejects payments with another order reference or amount', () => {
    const order = { id: 'order-1', total: '38.80' };
    expect(paymentMatchesOrder('order-1', 38.8, order)).toBe(true);
    expect(paymentMatchesOrder('order-1', 38.79, order)).toBe(false);
    expect(paymentMatchesOrder('order-2', 38.8, order)).toBe(false);
  });
  it('uses the public domain even behind an internal HTTP proxy', () => {
    expect(paymentOrigin('http://localhost:3000/rpc', 'https://3dtechstudio.com.br')).toBe('https://3dtechstudio.com.br');
    expect(() => paymentOrigin('http://localhost:3000', 'https://example.com/path')).toThrow();
  });
  it('keeps Google broker only in the managed preview, never on Hostinger', () => {
    expect(usesManagedGoogle('3dtechstudio.com.br')).toBe(false);
    expect(usesManagedGoogle('store.hostingersite.com')).toBe(false);
    expect(usesManagedGoogle('id-preview.lovable.app')).toBe(true);
  });
});