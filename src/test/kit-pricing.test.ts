import { describe, it, expect } from 'vitest';
import { unitPrice } from '@/lib/pricing';
const cores = [{ nome: 'Verde', hex: '#00aa00', ajuste: 5 }];
const variacoes = { tamanhos: [{ nome: 'Grande', preco: 100 }], montagem: { ativo: true, vagas: 8, pecas: [{ nome: 'Papai Noel', preco: 4 }, { nome: 'Estrela', preco: 0 }] } };
describe('Monte o seu', () => {
  it('soma cada peça escolhida, inclusive repetidas, ao tamanho e cor', () => {
    expect(unitPrice(50, cores, variacoes, null, { cor: 'Verde', tamanho: 'Grande', pecas: ['Papai Noel', 'Papai Noel', 'Estrela'] })).toBe(113);
  });
  it('ignora peças quando a montagem está desligada', () => {
    expect(unitPrice(50, cores, { ...variacoes, montagem: { ...variacoes.montagem, ativo: false } }, null, { cor: 'Verde', pecas: ['Papai Noel'] })).toBe(55);
  });
});
