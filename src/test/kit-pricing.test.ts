import { describe, it, expect } from 'vitest';
import { unitPrice, priceBreakdown } from '@/lib/pricing';
import { validatedOrderItem } from '@/lib/product-configuration';
const cores = [{ nome: 'Verde', hex: '#00aa00', ajuste: 5 }];
const variacoes = { tamanhos: [{ nome: 'Grande', preco: 100 }], montagem: { ativo: true, vagas: 8, pecas: [{ nome: 'Papai Noel', preco: 4 }, { nome: 'Estrela', preco: 0 }] } };
describe('Monte o seu', () => {
  it('inclui os 8 bonequinhos sem acréscimo, mesmo repetidos ou com preços antigos', () => {
    const escolha = { cor: 'Verde', tamanho: 'Grande', pecas: Array(8).fill('Papai Noel') };
    expect(unitPrice(50, cores, variacoes, null, escolha)).toBe(105);
    expect(priceBreakdown(50, cores, variacoes, null, escolha).reduce((total, item) => total + item.valor, 0)).toBe(105);
  });
  it('ignora peças quando a montagem está desligada', () => {
    expect(unitPrice(50, cores, { ...variacoes, montagem: { ...variacoes.montagem, ativo: false } }, null, { cor: 'Verde', pecas: ['Papai Noel'] })).toBe(55);
  });
  it('exige exatamente os 8 bonequinhos inclusos e preserva a escolha no pedido', () => {
    const product = { id: '9da482bf-c02d-4776-8d9c-92b4b19790c0', nome: 'Guirlanda Enfeitada', preco: 99.9, materiais: ['PLA'], cores, variacoes: { ...variacoes, tamanhos: [] }, personalizacao: {} };
    const input = { id: product.id, quantity: 1, color: 'Verde', material: 'PLA' as const, configuration: { pecas: Array(8).fill('Papai Noel') } };
    const item = validatedOrderItem(product, input);
    expect(item.preco).toBe(104.9);
    expect(item.configuracao.pecas).toHaveLength(8);
    expect(() => validatedOrderItem(product, { ...input, configuration: { pecas: Array(7).fill('Papai Noel') } })).toThrow('8 peças inclusas');
    expect(() => validatedOrderItem(product, { ...input, configuration: { pecas: Array(9).fill('Papai Noel') } })).toThrow('no máximo 8');
    expect(() => validatedOrderItem(product, { ...input, configuration: { pecas: Array(8).fill('Inexistente') } })).toThrow('Peça indisponível');
  });
});
