import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { CUSTOM_MODELS } from '@/lib/customizer';
import { money, type ProductInput } from '@/lib/store-schema';
import { productionCost, suggestedPrice, type PricingConfig } from '@/lib/pricing';

type Options = Pick<ProductInput, 'variacoes' | 'personalizacao' | 'producao'>;
type Size = Options['variacoes']['tamanhos'][number];
type Kit = Options['variacoes']['montagem'];

export function ProductOptionsEditor({ value, onChange, pricing, onPrice }: { value: Options; onChange: (v: Options) => void; pricing: PricingConfig; onPrice: (price: number) => void }) {
  const { variacoes, personalizacao, producao } = value;
  const cost = productionCost(producao, pricing);
  const setSizes = (tamanhos: Size[]) => onChange({ ...value, variacoes: { ...variacoes, tamanhos } });
  const setSize = (i: number, patch: Partial<Size>) => setSizes(variacoes.tamanhos.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const kit = variacoes.montagem;
  const setKit = (patch: Partial<Kit>) => onChange({ ...value, variacoes: { ...variacoes, montagem: { ...kit, ...patch } } });
  const setPiece = (i: number, patch: Partial<Kit['pecas'][number]>) => setKit({ pecas: kit.pecas.map((v, j) => (j === i ? { ...v, ...patch } : v)) });
  const setP = (patch: Partial<Options['personalizacao']>) => onChange({ ...value, personalizacao: { ...personalizacao, ...patch } });

  return <>
    <section className="pf-section">
      <h3>Variação: tamanho</h3>
      <p className="pf-hint">Como na Shopee: cada tamanho tem nome e preço. Deixe o preço vazio para usar o preço base. Sem tamanhos, o produto tem tamanho único.</p>
      {variacoes.tamanhos.length > 0 && <div className="grid gap-2">
        <div className="grid grid-cols-[1fr_120px_auto] gap-2 text-sm text-muted-foreground"><span>Tamanho (ex.: P, 20 cm)</span><span>Preço (R$)</span><span /></div>
        {variacoes.tamanhos.map((t, i) => <div key={i} className="grid gap-1">
          <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
            <input aria-label="Nome do tamanho" value={t.nome} maxLength={40} placeholder="Ex.: Médio" onChange={e => setSize(i, { nome: e.target.value })} />
            <input aria-label="Preço do tamanho" type="number" min={0} step="0.01" placeholder="Base" value={t.preco ?? ''} onChange={e => setSize(i, { preco: e.target.value === '' ? null : Number(e.target.value) })} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remover tamanho" onClick={() => setSizes(variacoes.tamanhos.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
          <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Medidas (opcional)</summary>
            <div className="grid grid-cols-3 gap-2 pt-2">{(['altura', 'largura', 'profundidade'] as const).map(k => <label key={k}>{k} (cm)<input value={t[k]} maxLength={20} onChange={e => setSize(i, { [k]: e.target.value })} /></label>)}</div>
          </details>
        </div>)}
      </div>}
      <Button type="button" variant="outline" disabled={variacoes.tamanhos.length >= 10} onClick={() => setSizes([...variacoes.tamanhos, { nome: '', altura: '', largura: '', profundidade: '', preco: null }])}><Plus />Adicionar tamanho</Button>
    </section>

    <section className="pf-section">
      <h3>Monte o seu (peças para escolher)</h3>
      <p className="pf-hint">Na guirlanda, os 8 bonequinhos já estão inclusos no preço. Cadastre as opções para o cliente escolher, sem cobrar por peça.</p>
      <label className="pf-switch"><input type="checkbox" checked={kit.ativo} onChange={e => setKit({ ativo: e.target.checked })} /><span>Cliente monta escolhendo peças</span></label>
      {kit.ativo && <>
        <label className="pf-switch"><input type="checkbox" checked={kit.inclusas} onChange={e => setKit({ inclusas: e.target.checked })} /><span>Peças inclusas no preço do produto</span></label>
        <div className="form-row">
          <label>Título na página<input value={kit.titulo} maxLength={60} placeholder="Monte sua guirlanda" onChange={e => setKit({ titulo: e.target.value })} /></label>
          <label>Quantas vagas (pinos)<input type="number" min={1} max={20} value={kit.vagas} onChange={e => setKit({ vagas: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} /></label>
        </div>
        {kit.pecas.length > 0 && <div className="text-sm text-muted-foreground">Peças disponíveis{kit.inclusas ? ' · sem acréscimo' : ' · com preço separado'}</div>}
        {kit.pecas.map((x, i) => <div key={i} className={`grid ${kit.inclusas ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_120px_auto]'} gap-2 items-center py-1`}>
          <input aria-label="Nome da peça" value={x.nome} maxLength={60} onChange={e => setPiece(i, { nome: e.target.value })} />
          {!kit.inclusas && <input aria-label="Preço da peça" type="number" min={0} step="0.01" value={x.preco} onChange={e => setPiece(i, { preco: Number(e.target.value) })} />}
          <Button type="button" variant="ghost" size="icon" aria-label="Remover peça" onClick={() => setKit({ pecas: kit.pecas.filter((_, j) => j !== i) })}><Trash2 /></Button>
        </div>)}
        <Button type="button" variant="outline" disabled={kit.pecas.length >= 60} onClick={() => setKit({ pecas: [...kit.pecas, { nome: '', preco: 0 }] })}><Plus />Adicionar peça</Button>
      </>}
    </section>

    <section className="pf-section">
      <details>
        <summary className="cursor-pointer font-semibold">Personalização com nome, medidas ou arquivo (opcional)</summary>
        <div className="grid gap-2 pt-3">
          <label className="pf-switch"><input type="checkbox" checked={personalizacao.ativo} onChange={e => setP({ ativo: e.target.checked })} /><span>Este produto aceita personalização</span></label>
          {personalizacao.ativo && <>
            {(['texto', 'medidas', 'upload', 'compra_direta'] as const).map(k => <label className="pf-switch" key={k}><input type="checkbox" checked={personalizacao[k]} onChange={e => setP({ [k]: e.target.checked })} /><span>{{ texto: 'Cliente escreve um nome / texto', medidas: 'Cliente informa medidas', upload: 'Cliente envia um arquivo', compra_direta: 'Pode comprar direto pelo site' }[k]}</span></label>)}
            <label>Modelo 3D do estúdio<select value={personalizacao.modelo} onChange={e => setP({ modelo: e.target.value })}><option value="">Nenhum</option>{CUSTOM_MODELS.map(m => <option key={m.slug} value={m.slug}>{m.nome}</option>)}</select></label>
            <p className="pf-hint">Extras pagos (ex.: “Embalagem presente”):</p>
            {personalizacao.extras.map((x, i) => <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-center" key={i}><input aria-label="Nome do extra" value={x.nome} maxLength={60} onChange={e => setP({ extras: personalizacao.extras.map((v, j) => (j === i ? { ...v, nome: e.target.value } : v)) })} /><input aria-label="Acréscimo do extra" type="number" min={0} step="0.01" value={x.preco} onChange={e => setP({ extras: personalizacao.extras.map((v, j) => (j === i ? { ...v, preco: Number(e.target.value) } : v)) })} /><Button type="button" variant="ghost" size="icon" aria-label="Remover extra" onClick={() => setP({ extras: personalizacao.extras.filter((_, j) => j !== i) })}><Trash2 /></Button></div>)}
            <Button type="button" variant="outline" disabled={personalizacao.extras.length >= 10} onClick={() => setP({ extras: [...personalizacao.extras, { nome: '', preco: 0 }] })}><Plus />Adicionar extra</Button>
          </>}
        </div>
      </details>
    </section>

    <section className="pf-section"><h3>Custo de impressão</h3><div className="form-row">{(['peso_g', 'tempo_min', 'custo_extra'] as const).map(k => <label key={k}>{{ peso_g: 'Peso real (g)', tempo_min: 'Tempo real (min)', custo_extra: 'Custo extra (R$)' }[k]}<input type="number" min={0} step="0.01" value={producao[k] ?? ''} onChange={e => onChange({ ...value, producao: { ...producao, [k]: e.target.value === '' ? null : Number(e.target.value) } })} /></label>)}</div>{cost === null ? <p className="text-muted-foreground">Informe o peso e o tempo reais da impressão para calcular.</p> : <div className="summary-line"><span>Custo: {money(cost)} · Sugerido (+90%): {money(suggestedPrice(cost, pricing))}</span><Button type="button" variant="outline" onClick={() => onPrice(suggestedPrice(cost, pricing))}>Usar preço sugerido</Button></div>}</section>
  </>;
}
