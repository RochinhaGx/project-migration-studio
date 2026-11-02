import { Boxes, Sprout, Gamepad2, Rocket, PencilRuler, Church, Lightbulb, TreePine, Gift, BriefcaseBusiness, Baby, PawPrint, CookingPot, Shapes } from 'lucide-react';

export type StoreCategory = { nome: string; oculto: boolean; ordem: number };
export function visibleCategoryNames(categories: StoreCategory[]) {
  return [...categories].filter(c => !c.oculto).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR')).map(c => c.nome);
}
export function categoryIcon(name: string) {
  const icons: Record<string, typeof Boxes> = { todos: Boxes, decoracao: Sprout, gaming: Gamepad2, geek: Rocket, utilidades: PencilRuler, religioso: Church, iluminacao: Lightbulb, natal: TreePine, presentes: Gift, escritorio: BriefcaseBusiness, infantil: Baby, pets: PawPrint, cozinha: CookingPot, personalizados: PencilRuler };
  return icons[name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()] ?? Shapes;
}