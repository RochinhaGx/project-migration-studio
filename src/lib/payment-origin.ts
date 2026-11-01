export function paymentOrigin(requestUrl: string, configuredOrigin?: string) {
  const url = new URL(configuredOrigin || requestUrl);
  if (url.username || url.password || !['http:', 'https:'].includes(url.protocol)) throw new Error('Endereço da loja inválido.');
  if (configuredOrigin && (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash)) throw new Error('APP_URL deve ser o endereço HTTPS da loja, sem caminho.');
  return url.origin;
}
export function usesManagedGoogle(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.lovable.app') || hostname.endsWith('.lovableproject.com');
}