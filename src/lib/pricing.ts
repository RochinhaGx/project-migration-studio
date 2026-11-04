/**
 * Calculadora de precificação de impressão 3D e variações de produto.
 * Regra do dono: preço = custo total × 1,9 (margem de 90% sobre o custo).
 * Nunca inventar peso ou tempo de impressão: sem esses dados não há custo calculado.
 */

export type PricingConfig = {
  /** Custo do filamento em R$ por quilo. */
  custo_filamento_kg: number;
  /** Custo da energia em R$ por kWh. */
  custo_energia_kwh: number;
  /** Potência média da impressora em watts. */
  potencia_w: number;
  /** Custo de máquina/depreciação em R$ por hora de impressão. */
  custo_hora_maquina: number;
  /** Taxa de falha/retrabalho aplicada sobre o material (0,1 = 10%). */
  taxa_falha: number;
  /** Multiplicador sobre o custo total (1,9 = 90% de margem). */
  margem: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  custo_filamento_kg: 120,
  custo_energia_kwh: 0.9,
  potencia_w: 150,
  custo_hora_maquina: 0.5,
  taxa_falha: 0.1,
  margem: 1.9,
};

export type ProductionData = {
  peso_g?: number | null;
  tempo_min?: number | null;
  custo_extra?: number | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Custo de fabricação a partir do peso e tempo informados pelo administrador.
 * Retorna null quando peso ou tempo não foram informados — nunca estima por conta própria.
 */
export function productionCost(p: ProductionData, c: PricingConfig): number | null {
  const peso = Number(p.peso_g);
  const tempo = Number(p.tempo_min);
  if (!Number.isFinite(peso) || peso <= 0 || !Number.isFinite(tempo) || tempo <= 0) return null;
  const material = (peso / 1000) * c.custo_filamento_kg * (1 + c.taxa_falha);
  const energia = (tempo / 60) * (c.potencia_w / 1000) * c.custo_energia_kwh;
  const maquina = (tempo / 60) * c.custo_hora_maquina;
  const extra = Number(p.custo_extra) > 0 ? Number(p.custo_extra) : 0;
  return round2(material + energia + maquina + extra);
}

/** Preço sugerido: custo total × margem (padrão ×1,9). */
export function suggestedPrice(cost: number, c: PricingConfig): number {
  return round2(cost * c.margem);
}

export type SizeOption = {
  nome: string;
  altura?: string;
  largura?: string;
  profundidade?: string;
  /** Quando definido, substitui o preço base do produto. */
  preco?: number | null;
};

export type ColorOption = { nome: string; hex: string; ajuste?: number | null };

export type ExtraOption = { nome: string; preco: number };

export type Personalization = {
  ativo?: boolean;
  compra_direta?: boolean;
  modelo?: string;
  texto?: boolean;
  medidas?: boolean;
  upload?: boolean;
  extras?: ExtraOption[];
};

export type Variations = { tamanhos?: SizeOption[] };

export type ItemConfiguration = {
  cor: string;
  tamanho?: string;
  medidas?: { altura?: string; largura?: string; profundidade?: string };
  texto?: string;
  extras?: string[];
};

/**
 * Preço unitário de um produto com as escolhas do cliente.
 * Tamanho com preço próprio substitui o preço base; ajuste de cor e extras somam.
 */
export function unitPrice(
  base: number,
  cores: ColorOption[],
  variacoes: Variations | null | undefined,
  personalizacao: Personalization | null | undefined,
  escolha: { cor: string; tamanho?: string; extras?: string[] },
): number {
  const tamanho = escolha.tamanho
    ? variacoes?.tamanhos?.find((t) => t.nome === escolha.tamanho)
    : undefined;
  const baseEfetiva = tamanho && tamanho.preco != null ? Number(tamanho.preco) : base;
  const ajusteCor = Number(cores.find((c) => c.nome === escolha.cor)?.ajuste) || 0;
  const extras = (personalizacao?.ativo === false ? [] : [...new Set(escolha.extras ?? [])]).reduce((s, nome) => {
    const e = personalizacao?.extras?.find((x) => x.nome === nome);
    return s + (e && Number(e.preco) > 0 ? Number(e.preco) : 0);
  }, 0);
  return round2(Math.max(0, baseEfetiva + ajusteCor + extras));
}

/** Detalhamento do preço para o cliente ver quanto paga por cada escolha. */
export function priceBreakdown(
  base: number,
  cores: ColorOption[],
  variacoes: Variations | null | undefined,
  personalizacao: Personalization | null | undefined,
  escolha: { cor: string; tamanho?: string; extras?: string[] },
): { rotulo: string; valor: number }[] {
  const itens: { rotulo: string; valor: number }[] = [];
  const tamanho = escolha.tamanho
    ? variacoes?.tamanhos?.find((t) => t.nome === escolha.tamanho)
    : undefined;
  if (tamanho && tamanho.preco != null) itens.push({ rotulo: `Tamanho ${tamanho.nome}`, valor: Number(tamanho.preco) });
  else itens.push({ rotulo: 'Preço base', valor: base });
  const ajusteCor = Number(cores.find((c) => c.nome === escolha.cor)?.ajuste) || 0;
  if (ajusteCor !== 0) itens.push({ rotulo: `Cor ${escolha.cor}`, valor: ajusteCor });
  for (const nome of personalizacao?.ativo === false ? [] : [...new Set(escolha.extras ?? [])]) {
    const e = personalizacao?.extras?.find((x) => x.nome === nome);
    if (e && Number(e.preco) > 0) itens.push({ rotulo: e.nome, valor: Number(e.preco) });
  }
  return itens;
}
