import { describe, expect, it } from 'vitest';
import { Shapes, TreePine } from 'lucide-react';
import { categoryIcon, visibleCategoryNames } from '@/lib/store-categories';
describe('Storefront categories', () => {
  it('shows newly created visible categories in admin order', () => {
    expect(visibleCategoryNames([{ nome: 'Novas peças', oculto: false, ordem: 2 }, { nome: 'Natal', oculto: false, ordem: 1 }])).toEqual(['Natal', 'Novas peças']);
  });
  it('does not show hidden categories', () => {
    expect(visibleCategoryNames([{ nome: 'Oculta', oculto: true, ordem: 1 }])).toEqual([]);
  });
  it('assigns a known icon and a fallback for newly named categories', () => {
    expect(categoryIcon('Natal')).toBe(TreePine);
    expect(categoryIcon('Novas peças')).toBe(Shapes);
  });
});