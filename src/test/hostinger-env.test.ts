// @vitest-environment node
import { expect, it } from 'vitest';
// @ts-expect-error Operator script is plain JavaScript, deliberately independent of app bundling.
import { validateHostingerEnv } from '../../scripts/hostinger-env.mjs';
const valid = { APP_URL: 'https://3dtechstudio.com.br', VITE_SUPABASE_URL: 'https://destination.example', SUPABASE_URL: 'https://destination.example', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-fixture', SUPABASE_PUBLISHABLE_KEY: 'public-fixture', SUPABASE_SERVICE_ROLE_KEY: 'private-fixture', STRIPE_RESTRICTED_API_KEY: 'stripe-fixture', STRIPE_WEBHOOK_SECRET: 'stripe-signature-fixture', MERCADOPAGO_ACCESS_TOKEN: 'mp-fixture', MERCADOPAGO_WEBHOOK_SECRET: 'mp-signature-fixture' };
it('accepts matching destination settings', () => expect(validateHostingerEnv(valid)).toEqual([]));
it('requires a server-only database key and signed Pix notifications', () => {
  expect(validateHostingerEnv({ ...valid, SUPABASE_SERVICE_ROLE_KEY: '', MERCADOPAGO_WEBHOOK_SECRET: '' })).toEqual(['Configure SUPABASE_SERVICE_ROLE_KEY na Hostinger.', 'Configure MERCADOPAGO_WEBHOOK_SECRET na Hostinger.']);
});
it('blocks mismatched databases and browser-exposed secrets', () => {
  expect(validateHostingerEnv({ ...valid, SUPABASE_URL: 'https://wrong.example', VITE_ACCESS_TOKEN: 'fixture' })).toEqual(['O banco do navegador e do servidor deve ser o mesmo.', 'Remova VITE_ACCESS_TOKEN: chave privada não pode ter prefixo VITE_.']);
});