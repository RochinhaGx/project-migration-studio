import { describe, expect, it } from 'vitest';
import { productSchema } from '@/lib/store-schema';

const product = { nome: 'Suporte', categoria: 'Gaming', preco: 49.9 };
describe('Product availability and models', () => {
  it('defaults existing imports to PLA without a model', () => {
    const parsed = productSchema.parse(product);
    expect(parsed.materiais).toEqual(['PLA']);
    expect(parsed.modelo_3d).toBeNull();
  });
  it('rejects empty or unsupported materials', () => {
    expect(productSchema.safeParse({ ...product, materiais: [] }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, materiais: ['ABS'] }).success).toBe(false);
  });
  it('rejects external model paths', () => {
    expect(productSchema.safeParse({ ...product, modelo_3d: 'https://example.org/model.obj' }).success).toBe(false);
  });
});