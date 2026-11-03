import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRICING,
  priceBreakdown,
  productionCost,
  suggestedPrice,
  unitPrice,
} from '@/lib/pricing';

describe('productionCost', () => {
  it('soma material com taxa de falha, energia, máquina e custo extra', () => {
    // 100 g a R$ 120/kg com 10% de falha = 13,20; 2 h a 150 W = 0,3 kWh × 0,9 = 0,27; 2 h × 0,5 = 1,00; extra 2,00
    const custo = productionCost({ peso_g: 100, tempo_min: 120, custo_extra: 2 }, DEFAULT_PRICING);
    expect(custo).toBeCloseTo(13.2 + 0.27 + 1 + 2, 2);
  });

  it('nunca inventa peso ou tempo: sem dados retorna null', () => {
    expect(productionCost({ peso_g: null, tempo_min: 120 }, DEFAULT_PRICING)).toBeNull();
    expect(productionCost({ peso_g: 100, tempo_min: null }, DEFAULT_PRICING)).toBeNull();
    expect(productionCost({ peso_g: 0, tempo_min: 0 }, DEFAULT_PRICING)).toBeNull();
  });
});

describe('suggestedPrice', () => {
  it('aplica a margem de 90% sobre o custo (custo × 1,9)', () => {
    expect(suggestedPrice(10, DEFAULT_PRICING)).toBe(19);
    expect(suggestedPrice(16.47, DEFAULT_PRICING)).toBe(31.29);
  });
});

describe('unitPrice', () => {
  const cores = [
    { nome: 'Preto', hex: '#1A1A1A' },
    { nome: 'Colorido', hex: '#C8553D', ajuste: 15 },
  ];
  const variacoes = {
    tamanhos: [
      { nome: 'Pequeno' },
      { nome: 'Grande', altura: '20', largura: '15', profundidade: '10', preco: 89.9 },
    ],
  };
  const personalizacao = { ativo: true, extras: [{ nome: 'Nome gravado', preco: 12 }] };

  it('usa o preço base quando não há variações', () => {
    expect(unitPrice(49.9, cores, null, null, { cor: 'Preto' })).toBe(49.9);
  });

  it('soma o ajuste da cor escolhida', () => {
    expect(unitPrice(49.9, cores, null, null, { cor: 'Colorido' })).toBe(64.9);
  });

  it('tamanho com preço próprio substitui o preço base', () => {
    expect(unitPrice(49.9, cores, variacoes, null, { cor: 'Preto', tamanho: 'Grande' })).toBe(89.9);
  });

  it('combina tamanho, cor e extras', () => {
    expect(
      unitPrice(49.9, cores, variacoes, personalizacao, { cor: 'Colorido', tamanho: 'Grande', extras: ['Nome gravado'] }),
    ).toBe(116.9);
  });

  it('ignora extras que não existem no cadastro do produto', () => {
    expect(unitPrice(49.9, cores, null, personalizacao, { cor: 'Preto', extras: ['Inventado'] })).toBe(49.9);
  });
});

describe('priceBreakdown', () => {
  it('detalha cada parcela para o cliente', () => {
    const itens = priceBreakdown(
      49.9,
      [{ nome: 'Colorido', hex: '#C8553D', ajuste: 15 }],
      { tamanhos: [{ nome: 'Grande', preco: 89.9 }] },
      { extras: [{ nome: 'Nome gravado', preco: 12 }] },
      { cor: 'Colorido', tamanho: 'Grande', extras: ['Nome gravado'] },
    );
    expect(itens).toEqual([
      { rotulo: 'Tamanho Grande', valor: 89.9 },
      { rotulo: 'Cor Colorido', valor: 15 },
      { rotulo: 'Nome gravado', valor: 12 },
    ]);
  });
});
