import { describe, expect, it } from 'vitest';
import { shopeeRow, shopeeImageUrl, type ShopeeDetails } from '@/lib/shopee-export';
import { productSchema } from '@/lib/store-schema';
import type { Product } from '@/lib/catalog.functions';

const product = { ...productSchema.parse({ nome: 'Árvore de Natal', descricao: 'Árvore impressa em PLA', categoria: 'Natal', preco: 38.8, imagens: ['https://3dtechstudio.com.br/tree.jpg', 'https://3dtechstudio.com.br/tree-2.jpg'] }), id: 'tree-id', created_at: '' } as Product;
const details: ShopeeDetails = { description: product.descricao, weight: '0.15', stock: '5', cover: product.imagens[0] ?? '', category: '' };
describe('Shopee basic form export', () => {
  it('exports a new product at the supplied template column positions', () => {
    const row = shopeeRow(product, details, 'https://3dtechstudio.com.br');
    expect([row[1], row[2], row[10], row[11], row[17], row[18], row[26]]).toEqual(['Árvore de Natal', 'Árvore impressa em PLA', 38.8, 5, 'https://3dtechstudio.com.br/tree.jpg', 'https://3dtechstudio.com.br/tree-2.jpg', 0.15]);
    expect(row[0]).toBe('');
    expect(row[30]).toBe('Ativado');
    expect(row.slice(33)).toEqual(Array(19).fill(''));
  });
  it('requires an explicitly supplied weight rather than inventing one', () => {
    expect(() => shopeeRow(product, { ...details, weight: '' }, 'https://3dtechstudio.com.br')).toThrow('peso');
  });
  it('requires an explicitly supplied stock rather than inventing inventory', () => {
    expect(() => shopeeRow(product, { ...details, stock: '' }, 'https://3dtechstudio.com.br')).toThrow('estoque');
  });
  it('does not export local preview or missing image placeholders', () => {
    expect(shopeeImageUrl('/produto-sem-foto.svg', 'https://3dtechstudio.com.br')).toBe('');
    expect(shopeeImageUrl('/tree.jpg', 'http://localhost:8080')).toBe('');
    expect(shopeeImageUrl('/tree.jpg', 'https://3dtechstudio.com.br')).toBe('https://3dtechstudio.com.br/tree.jpg');
  });
});