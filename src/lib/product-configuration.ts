import { z } from 'zod';
import { itemConfigurationSchema, personalizacaoSchema, variacoesSchema, type ItemConfiguration } from './store-schema';
import { unitPrice, type ColorOption } from './pricing';

export const checkoutItemSchema = z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(99), color: z.string().min(1).max(40), material: z.enum(['PLA', 'PETG']), configuration: itemConfigurationSchema.optional() });
type ConfigurableProduct = { id: string; nome: string; preco: number | string; materiais: string[]; cores: unknown; variacoes: unknown; personalizacao: unknown };
export function productOptions(p: { cores: unknown; variacoes: unknown; personalizacao: unknown }) {
  const cores = z.array(z.object({ nome: z.string(), hex: z.string(), ajuste: z.number().nullable().optional() })).parse(p.cores) as ColorOption[];
  return { cores, variacoes: variacoesSchema.parse(p.variacoes ?? {}), personalizacao: personalizacaoSchema.parse(p.personalizacao ?? {}) };
}
export function configuredPrice(p: ConfigurableProduct, color: string, configuration: ItemConfiguration = {}) {
  const o = productOptions(p);
  return unitPrice(Number(p.preco), o.cores, o.variacoes, o.personalizacao, { cor: color, tamanho: configuration.tamanho, extras: configuration.extras });
}
export function validatedOrderItem(p: ConfigurableProduct, input: z.infer<typeof checkoutItemSchema>) {
  const o = productOptions(p); const c = itemConfigurationSchema.parse(input.configuration ?? {});
  if (!p.materiais.includes(input.material)) throw new Error(`Material indisponível para ${p.nome}.`);
  if (!o.cores.some(x => x.nome === input.color)) throw new Error(`Cor indisponível para ${p.nome}.`);
  if (o.variacoes.tamanhos.length && !o.variacoes.tamanhos.some(x => x.nome === c.tamanho)) throw new Error('Selecione um tamanho disponível.');
  if (c.tamanho && !o.variacoes.tamanhos.some(x => x.nome === c.tamanho)) throw new Error('Tamanho indisponível.');
  if (o.personalizacao.ativo && !o.personalizacao.compra_direta) throw new Error('Este produto não está disponível para compra direta.');
  if (!o.personalizacao.ativo && (c.texto || c.medidas || c.arquivo || c.parametros || c.extras?.length)) throw new Error('Personalização indisponível.');
  if (c.texto && !o.personalizacao.texto && !o.personalizacao.modelo) throw new Error('Texto indisponível.');
  if (c.medidas && !o.personalizacao.medidas && !o.personalizacao.modelo) throw new Error('Medidas indisponíveis.');
  if (c.arquivo && !o.personalizacao.upload && !o.personalizacao.modelo) throw new Error('Arquivo indisponível.');
  if (c.parametros && !o.personalizacao.modelo) throw new Error('Modelo indisponível.');
  if (o.personalizacao.modelo && !c.arquivo) throw new Error('Personalize o modelo e envie seu arquivo 3D antes de comprar.');
  if ((c.extras ?? []).some(n => !o.personalizacao.extras.some(e => e.nome === n))) throw new Error('Extra indisponível.');
  c.extras = [...new Set(c.extras ?? [])];
  return { id: p.id, nome: p.nome, preco: configuredPrice(p, input.color, c), quantidade: input.quantity, cor: input.color, material: input.material, configuracao: c };
}