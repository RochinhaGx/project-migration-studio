async function verifyHmac(message: string, signatures: string[], secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  for (const signature of signatures) {
    if (!/^[a-f0-9]{64}$/i.test(signature)) continue;
    const bytes = new Uint8Array(signature.match(/.{2}/g)?.map((pair) => parseInt(pair, 16)) ?? []);
    if (await crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(message))) return true;
  }
  return false;
}
export async function verifyStripeSignature(raw: string, header: string, secret: string, now = Date.now()) {
  const parts = header.split(',').map((part) => part.trim().split('='));
  const timestamp = parts.find(([name]) => name === 't')?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  return verifyHmac(`${timestamp}.${raw}`, parts.filter(([name]) => name === 'v1').map(([, value]) => value ?? ''), secret);
}
export async function verifyMercadoPagoSignature(header: string, requestId: string, dataId: string, secret: string) {
  const parts = header.split(',').map((part) => part.trim().split('='));
  const timestamp = parts.find(([name]) => name === 'ts')?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || !requestId || requestId.length > 200 || !/^\d{1,20}$/.test(dataId)) return false;
  return verifyHmac(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`, parts.filter(([name]) => name === 'v1').map(([, value]) => value ?? ''), secret);
}
export function paymentMatchesOrder(reference: unknown, amount: unknown, order: { id: string; total: number | string }) {
  return reference === order.id && typeof amount === 'number' && Number.isFinite(amount) && Math.round(amount * 100) === Math.round(Number(order.total) * 100);
}