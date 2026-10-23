import { describe, expect, it } from 'vitest';
import { estimateFreight, isValidCpf, maskCpf, orderStatusFromMp, payerSchema, pixFailureFromMp } from '@/lib/payment-rules';

describe('Pix payment rules', () => {
  it('accepts a valid CPF and rejects wrong check digits or repeated digits', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('529.982.247-24')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });
  it('masks CPF as 000.000.000-00', () => {
    expect(maskCpf('52998224725')).toBe('529.982.247-25');
  });
  it('requires full name, email and CPF from the payer', () => {
    expect(payerSchema.safeParse({ nome: 'Maria', email: 'm@x.com', cpf: '529.982.247-25' }).success).toBe(false);
    expect(payerSchema.safeParse({ nome: 'Maria Silva', email: 'm@x.com', cpf: '529.982.247-25' }).success).toBe(true);
  });
  it('charges SP freight at the base PAC and SEDEX prices', () => {
    expect(estimateFreight('06817-000')?.map((f) => f.price)).toEqual([14.9, 24.9]);
  });
  it('marks the order paid only when Mercado Pago approves', () => {
    expect(orderStatusFromMp('approved')).toBe('pago');
    expect(orderStatusFromMp('pending')).toBeNull();
    expect(orderStatusFromMp('cancelled')).toBe('cancelado');
  });
  it('reports a rejected Pix as refused', () => {
    expect(pixFailureFromMp('rejected', 'cc_rejected_other_reason')).toBe('recusado');
  });
  it('reports a cancelled or time-expired Pix as expired', () => {
    expect(pixFailureFromMp('cancelled', 'expired')).toBe('expirado');
    expect(pixFailureFromMp('pending', null, '2026-01-01T10:00:00Z', Date.parse('2026-01-01T10:00:01Z'))).toBe('expirado');
  });
  it('keeps a pending Pix within its deadline payable', () => {
    expect(pixFailureFromMp('pending', null, '2026-01-01T10:00:00Z', Date.parse('2026-01-01T09:59:00Z'))).toBeNull();
    expect(pixFailureFromMp('approved')).toBeNull();
  });
});
