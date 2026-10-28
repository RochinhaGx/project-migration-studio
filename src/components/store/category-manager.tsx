import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/notify';

export type Category = { id: string; nome: string; oculto: boolean; ordem: number };

export function useCategories() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias').select('id,nome,oculto,ordem').order('ordem').order('nome');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function CategoryManager({ onClose, usage }: { onClose: () => void; usage: Record<string, number> }) {
  const qc = useQueryClient();
  const cats = useCategories();
  const [nome, setNome] = useState('');
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ['categorias'] }); await qc.invalidateQueries({ queryKey: ['products'] }); };

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = nome.trim();
    if (!n) { return; }
    const { error } = await supabase.from('categorias').insert({ nome: n.slice(0, 80), ordem: (cats.data?.length ?? 0) + 1 });
    if (error) { toast.error(error.code === '23505' ? 'Essa categoria já existe.' : 'Não foi possível adicionar.'); return; }
    setNome(''); toast.success('Categoria adicionada'); await refresh();
  }
  async function toggle(c: Category) {
    const { error } = await supabase.from('categorias').update({ oculto: !c.oculto }).eq('id', c.id);
    if (error) { toast.error('Não foi possível alterar.'); return; }
    await refresh();
  }
  async function remove(c: Category) {
    const used = usage[c.nome] ?? 0;
    if (!window.confirm(used ? `${c.nome} tem ${used} produto(s). Remover mesmo assim? Os produtos continuam com esse nome de categoria.` : `Remover ${c.nome}?`)) return;
    const { error } = await supabase.from('categorias').delete().eq('id', c.id);
    if (error) { toast.error('Não foi possível remover.'); return; }
    toast.success('Categoria removida'); await refresh();
  }

  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Categorias">
    <div className="admin-modal-body">
      <div className="modal-heading"><h2>Categorias</h2><Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}><X /></Button></div>
      <p className="pf-hint">Categorias ocultas e seus produtos não aparecem na loja.</p>
      <form className="flex gap-2 my-3" onSubmit={add}>
        <input className="flex-1 rounded-md border border-border p-2" placeholder="Nova categoria" maxLength={80} value={nome} onChange={e => setNome(e.target.value)} aria-label="Nova categoria" />
        <Button type="submit"><Plus />Adicionar</Button>
      </form>
      <div className="table-scroll"><table className="admin-table"><thead><tr><th>Categoria</th><th>Produtos</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        {(cats.data ?? []).map(c => <tr key={c.id}><td>{c.nome}</td><td>{usage[c.nome] ?? 0}</td><td><span className="status-pill">{c.oculto ? 'Oculta' : 'Visível'}</span></td><td>
          <Button variant="ghost" size="icon" title={c.oculto ? 'Mostrar' : 'Ocultar'} aria-label={c.oculto ? 'Mostrar' : 'Ocultar'} onClick={() => void toggle(c)}>{c.oculto ? <EyeOff /> : <Eye />}</Button>
          <Button variant="ghost" size="icon" title="Remover" aria-label="Remover" onClick={() => void remove(c)}><Trash2 /></Button>
        </td></tr>)}
      </tbody></table></div>
    </div>
  </div>;
}
