import { z } from 'zod';

export const ORIGIN_CEP = '06817000';
export type Freight = { service: 'PAC' | 'SEDEX'; price: number; days: string };

/** Regional Correios estimate from origin CEP 06817-000. Shared by the bag and the server so totals match. */
export function estimateFreight(cep: string): Freight[] | null {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const region = Number(digits.slice(0, 2));
  const sp = region >= 1 && region <= 19;
  const southeast = region >= 20 && region <= 39;
  const factor = sp ? 1 : southeast ? 1.35 : 1.7;
  const days = sp ? '1–3 dias úteis' : southeast ? '3–6 dias úteis' : '5–10 dias úteis';
  const sedexDays = sp ? '1 dia útil' : southeast ? '2–3 dias úteis' : '3–5 dias úteis';
  return [
    { service: 'PAC', price: Math.round(14.9 * factor * 100) / 100, days },
    { service: 'SEDEX', price: Math.round(24.9 * factor * 100) / 100, days: sedexDays },
  ];
}

export function onlyDigits(v: string) { return v.replace(/\D/g, ''); }

export function maskCpf(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function maskCep(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Validates a Brazilian CPF using its two check digits. */
export function isValidCpf(v: string) {
  const d = onlyDigits(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

export const payerSchema = z.object({
  nome: z.string().trim().min(5, 'Informe seu nome completo.').max(120).refine((n) => n.split(/\s+/).length >= 2, 'Informe nome e sobrenome.'),
  email: z.string().trim().email('E-mail inválido.').max(255),
  cpf: z.string().trim().refine(isValidCpf, 'CPF inválido.'),
});
export type Payer = z.infer<typeof payerSchema>;

/** Maps a Mercado Pago payment status to the store order status, or null when the order should stay as is. */
export function orderStatusFromMp(status: string): 'pago' | 'cancelado' | null {
  if (status === 'approved') return 'pago';
  if (['rejected', 'cancelled', 'refunded', 'charged_back', 'expired'].includes(status)) return 'cancelado';
  return null;
}

export type PixFailure = 'expirado' | 'recusado';

/** Why a Pix can no longer be paid: expired (time ran out / cancelled) or refused by Mercado Pago. Null while it is payable or paid. */
export function pixFailureFromMp(status: string, detail?: string | null, expiresAt?: string | null, now = Date.now()): PixFailure | null {
  if (['rejected', 'refunded', 'charged_back'].includes(status)) return 'recusado';
  if (status === 'cancelled' || status === 'expired' || detail === 'expired') return 'expirado';
  if ((status === 'pending' || status === 'in_process') && expiresAt && new Date(expiresAt).getTime() <= now) return 'expirado';
  return null;
}
