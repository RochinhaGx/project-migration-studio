import { Plus, Minus, RotateCcw, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { money, type ProductInput } from '@/lib/store-schema';

export function KitBuilder({ kit, selected, onChange }: { kit: ProductInput['variacoes']['montagem']; selected: string[]; onChange: (pieces: string[]) => void }) {
  const complete = selected.length === kit.vagas;
  return <section className="kit-builder" aria-label={kit.titulo || 'Monte o seu'}>
    <div className="flex items-center justify-between gap-2"><label>{kit.titulo || 'Monte o seu'}</label><Button variant="ghost" size="icon" title="Limpar escolhas" aria-label="Limpar escolhas" disabled={!selected.length} onClick={() => onChange([])}><RotateCcw /></Button></div>
    <div className="flex items-center justify-between gap-2 text-sm"><span>{kit.inclusas ? `${kit.vagas} peças inclusas · sem acréscimo` : 'Peças com preço separado'}</span><strong aria-live="polite">{selected.length}/{kit.vagas}{complete && <Check className="inline ml-1" size={14}/>}</strong></div>
    <div className="kit-slots">{Array.from({ length: kit.vagas }, (_, i) => <Button type="button" variant="ghost" key={i} className={selected[i] ? 'kit-slot filled' : 'kit-slot'} aria-label={selected[i] ? `Remover ${selected[i]} da vaga ${i + 1}` : `Vaga ${i + 1} vazia`} disabled={!selected[i]} onClick={() => onChange(selected.filter((_, j) => j !== i))}>{selected[i] ? <><span>{selected[i]}</span><X size={12}/></> : <span>{i + 1}</span>}</Button>)}</div>
    <div className="kit-choice-list">{kit.pecas.map(piece => {
      const quantity = selected.filter(name => name === piece.nome).length;
      return <div key={piece.nome} className="kit-choice"><div><strong>{piece.nome}</strong>{!kit.inclusas && piece.preco > 0 && <small>+{money(piece.preco)}</small>}</div><div className="kit-stepper"><Button variant="outline" size="icon" aria-label={`Diminuir ${piece.nome}`} disabled={!quantity} onClick={() => { const index = selected.lastIndexOf(piece.nome); onChange(selected.filter((_, i) => i !== index)); }}><Minus/></Button><span aria-label={`Quantidade de ${piece.nome}`}>{quantity}</span><Button variant="outline" size="icon" aria-label={`Adicionar ${piece.nome}`} disabled={complete} onClick={() => onChange([...selected, piece.nome])}><Plus/></Button></div></div>;
    })}</div>
    {!kit.pecas.length && <p className="text-sm text-muted-foreground">Opções de peças ainda não disponíveis.</p>}
  </section>;
}