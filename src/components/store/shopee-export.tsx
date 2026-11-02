import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/catalog.functions';
import { exportShopee, type ShopeeDetails } from '@/lib/shopee-export';
import { toast } from '@/lib/notify';

export function ShopeeExport({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const [origin, setOrigin] = useState('https://3dtechstudio.com.br');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState<Record<string, ShopeeDetails>>(() => Object.fromEntries(products.map(p => [p.id, { description: p.descricao, weight: '', stock: '', cover: p.imagens[0] ?? '', category: '' }])));
  const update = (id: string, field: keyof ShopeeDetails, value: string) => setDetails(previous => ({ ...previous, [id]: { ...previous[id], [field]: value } as ShopeeDetails }));
  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Exportar para Shopee"><div className="admin-modal-body">
    <div className="modal-heading"><h2>Shopee · {products.length} produtos</h2><Button variant="ghost" size="icon" aria-label="Fechar exportação" onClick={onClose}><X /></Button></div>
    <form className="studio-form" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { await exportShopee(products, details, origin); toast.success('Planilha Shopee exportada'); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível exportar.'); } finally { setBusy(false); } }}>
      <label>Domínio público das imagens<input type="url" required value={origin} onChange={e => setOrigin(e.target.value)} /></label>
      <p className="text-sm text-muted-foreground">Informe o peso do produto embalado. As categorias da Shopee usam códigos próprios; se deixar em branco, selecione-as na Shopee. Confira o canal Shopee Xpress CPF e os dados fiscais antes de publicar.</p>
      {products.map(p => <fieldset key={p.id} className="border-t border-border py-4"><legend className="font-semibold">{p.nome}</legend>
        <label>Descrição<textarea required maxLength={5000} value={details[p.id]?.description ?? ''} onChange={e => update(p.id, 'description', e.target.value)} /></label>
        <div className="form-row"><label>Peso embalado (kg)<input type="number" step="any" min="0.000001" required value={details[p.id]?.weight ?? ''} onChange={e => update(p.id, 'weight', e.target.value)} /></label><label>Estoque<input type="number" step="1" min="1" required value={details[p.id]?.stock ?? ''} onChange={e => update(p.id, 'stock', e.target.value)} /></label></div>
        <label>Imagem de capa pública<input required value={details[p.id]?.cover ?? ''} onChange={e => update(p.id, 'cover', e.target.value)} /></label>
        <label>Código da categoria Shopee (opcional)<input inputMode="numeric" pattern="[0-9]*" value={details[p.id]?.category ?? ''} onChange={e => update(p.id, 'category', e.target.value)} /></label>
      </fieldset>)}
      {error && <p role="alert" className="error-text">{error}</p>}
      <Button type="submit" disabled={busy}><Download />{busy ? 'Gerando…' : 'Baixar formulário básico'}</Button>
    </form>
  </div></div>;
}