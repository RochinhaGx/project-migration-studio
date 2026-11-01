export function validateHostingerEnv(env) {
  const required = ['APP_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_RESTRICTED_API_KEY', 'STRIPE_WEBHOOK_SECRET', 'MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_WEBHOOK_SECRET'];
  const issues = required.filter((name) => !env[name]?.trim()).map((name) => `Configure ${name} na Hostinger.`);
  if (env.VITE_SUPABASE_URL && env.SUPABASE_URL && env.VITE_SUPABASE_URL.replace(/\/+$/, '') !== env.SUPABASE_URL.replace(/\/+$/, '')) issues.push('O banco do navegador e do servidor deve ser o mesmo.');
  if (env.VITE_SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_PUBLISHABLE_KEY && env.VITE_SUPABASE_PUBLISHABLE_KEY !== env.SUPABASE_PUBLISHABLE_KEY) issues.push('As duas chaves públicas devem ser iguais.');
  for (const name of ['APP_URL', 'VITE_SUPABASE_URL', 'SUPABASE_URL']) {
    if (!env[name]) continue;
    try { const url = new URL(env[name]); if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) issues.push(`${name} deve ser um endereço HTTPS sem caminho.`); }
    catch { issues.push(`${name} deve ser um endereço HTTPS válido.`); }
  }
  for (const name of Object.keys(env)) {
    if (name.startsWith('VITE_') && /SECRET|SERVICE_ROLE|ACCESS_TOKEN|RESTRICTED_API_KEY/i.test(name)) issues.push(`Remova ${name}: chave privada não pode ter prefixo VITE_.`);
  }
  return issues;
}