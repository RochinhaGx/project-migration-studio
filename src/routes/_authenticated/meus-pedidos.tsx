import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ORDER_STATUS, pageHead, money, type OrderItem } from '@/lib/store-schema';

export const Route = createFileRoute('/_authenticated/meus-pedidos')({ head: () => pageHead('Meus pedidos', 'Acompanhe o status dos seus pedidos na 3D Tech Studio.'), component: MyOrders });

function MyOrders() {
  const { user } = Route.useRouteContext();
  const q = useQuery({ queryKey: ['my-orders', user.id], queryFn: async () => { const { data, error } = await supabase.from('pedidos').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const list = q.data ?? [];
  return <section className="page-width form-page"><span className="eyebrow">SUA CONTA</span><h1 className="page-title">Meus pedidos</h1>
    {q.isPending && <p>Carregando pedidos…</p>}
    {q.isError && <p className="error-text">Não foi possível carregar seus pedidos.</p>}
    {q.isSuccess && !list.length && <div className="empty-state"><Package size={40} /><h2>Você ainda não fez pedidos.</h2><Button asChild><Link to="/catalogo">Explorar catálogo</Link></Button></div>}
    {list.map((o) => <div className="bag-summary" key={o.id} style={{ marginBottom: 16 }}>
      <div className="summary-line"><strong>Pedido #{o.id.slice(0, 8).toUpperCase()}</strong><span className="status-pill">{ORDER_STATUS[o.status as keyof typeof ORDER_STATUS] ?? o.status}</span></div>
      <small>{new Date(o.created_at).toLocaleString('pt-BR')}</small>
      {(o.itens as unknown as OrderItem[]).map((i, n) => <div className="summary-line" key={n}><span>{i.quantidade}× {i.nome} · {i.cor} · {i.material}</span><span>{money(i.preco * i.quantidade)}</span></div>)}
      <div className="summary-line total"><strong>Total</strong><strong>{money(Number(o.total))}</strong></div>
    </div>)}
  </section>;
}
