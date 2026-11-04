import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import { getPricingConfig, savePricingConfig } from '@/lib/pricing.functions';
import { DEFAULT_PRICING, type PricingConfig } from '@/lib/pricing';
export function PricingSettings({onClose}: {onClose:()=>void}) {
  const get = useServerFn(getPricingConfig); const save = useServerFn(savePricingConfig);
  const q = useQuery({queryKey:['pricing'],queryFn:()=>get()});
  const [draft,setDraft]=useState<PricingConfig|null>(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  const v = draft ?? q.data ?? DEFAULT_PRICING;
  return <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Precificação"><div className="admin-modal-body"><div className="modal-heading"><h2>Precificação 3D</h2><Button variant="ghost" size="icon" aria-label="Fechar precificação" onClick={onClose}><X/></Button></div><form className="studio-form" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await save({data:{...v,margem:1.9}});await q.refetch();setMessage('Configuração salva.');}catch{setMessage('Não foi possível salvar.');}finally{setBusy(false);}}}>
    <p className="text-muted-foreground">Valores iniciais editáveis. Confirme os custos reais da sua impressora e do filamento.</p>
    {(['custo_filamento_kg','custo_energia_kwh','potencia_w','custo_hora_maquina','taxa_falha'] as const).map(k=><label key={k}>{{custo_filamento_kg:'Filamento (R$/kg)',custo_energia_kwh:'Energia (R$/kWh)',potencia_w:'Potência média (W)',custo_hora_maquina:'Máquina (R$/hora)',taxa_falha:'Taxa de falha (0 a 1)'}[k]}<input type="number" min={0} max={k==='taxa_falha'?1:100000} step="0.01" required value={v[k]} onChange={e=>setDraft({...v,[k]:Number(e.target.value)})}/></label>)}<p>Margem: 90% sobre o custo · multiplicador 1,9</p>{message&&<p role="status">{message}</p>}<Button disabled={busy||q.isPending} type="submit"><Save/>{busy?'Salvando…':'Salvar custos'}</Button></form></div></div>;
}