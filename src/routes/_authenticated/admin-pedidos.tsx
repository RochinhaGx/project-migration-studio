import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { adminStatus, adminCustomOrders } from '@/lib/catalog.functions';
import { adminOrders, updateOrderStatus } from '@/lib/checkout.functions';
import { ORDER_STATUS, pageHead, money, type OrderItem, type OrderStatus } from '@/lib/store-schema';

export const Route = createFileRoute('/_authenticated/admin-pedidos')({ head: () => pageHead('Pedidos', 'Acompanhe os pedidos pagos da 3D Tech Studio.'), component: OrdersAdmin });

function OrdersAdmin() {
  const { user } = Route.useRouteContext();
  const statusFn = useServerFn(adminStatus); const listFn = useServerFn(adminOrders); const updateFn = useServerFn(updateOrderStatus); const qc = useQueryClient();
  const role = useQuery({ queryKey: ['admin-status', user.id], queryFn: () => statusFn() });
  const orders = useQuery({ queryKey: ['admin-orders'], queryFn: () => listFn(), enabled: role.data === true });
  const quotesFn = useServerFn(adminCustomOrders);
  const quotes = useQuery({ queryKey: ['admin-quotes'], queryFn: () => quotesFn(), enabled: role.data === true });
  if (role.isPending) return <div className="empty-state">Verificando acesso…</div>;
  if (!role.data) return <div className="page-width empty-state"><h2>Acesso restrito a administradores.</h2></div>;
  const list = orders.data ?? [];
  const paid = list.filter((o) => o.status !== 'aguardando_pagamento' && o.status !== 'cancelado');
  return <section className="page-width admin-page">
    <div className="admin-heading"><div><span className="eyebrow">STUDIO · PEDIDOS</span><h1>Pedidos da loja</h1></div><Button variant="outline" asChild><Link to="/admin"><ArrowLeft />Produtos</Link></Button></div>
    <div className="admin-stats"><div><strong>{list.length}</strong><span>Pedidos</span></div><div><strong>{paid.length}</strong><span>Pagos</span></div><div><strong>{money(paid.reduce((s, o) => s + Number(o.total), 0))}</strong><span>Faturado</span></div></div>
    {orders.isError && <p className="error-text">Não foi possível carregar os pedidos.</p>}
    {!orders.isPending && !list.length && <div className="empty-state"><h2>Nenhum pedido ainda.</h2><p>Os pedidos feitos pelo site aparecem aqui.</p></div>}
    {list.length > 0 && <div className="table-scroll"><table className="admin-table"><thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th></tr></thead><tbody>{list.map((o) => <tr key={o.id}>
      <td>#{o.id.slice(0, 8).toUpperCase()}</td>
      <td>{new Date(o.created_at).toLocaleString('pt-BR')}</td>
      <td>{o.email ?? 'Convidado'}</td>
      <td>{(o.itens as unknown as OrderItem[]).map((i) => `${i.quantidade}× ${i.nome} (${i.cor}, ${i.material})`).join(' · ')}</td>
      <td>{money(Number(o.total))}</td>
      <td><select aria-label={`Status do pedido ${o.id.slice(0, 8)}`} value={o.status} onChange={async (e) => { try { await updateFn({ data: { id: o.id, status: e.target.value as OrderStatus } }); await qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Status atualizado'); } catch { toast.error('Não foi possível atualizar'); } }}>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
    </tr>)}</tbody></table></div>}
    <div className="section-heading mt-12"><h2>Orçamentos sob medida</h2></div>
    {quotes.isError && <p className="error-text">Não foi possível carregar os orçamentos.</p>}
    {!quotes.isPending && !quotes.data?.length && <p className="text-muted-foreground">Nenhum orçamento recebido.</p>}
    {!!quotes.data?.length && <div className="table-scroll"><table className="admin-table"><thead><tr><th>Data</th><th>Cliente</th><th>Contato</th><th>Projeto</th><th>Arquivos</th></tr></thead><tbody>{quotes.data.map(o => <tr key={o.id}><td>{new Date(o.created_at).toLocaleString('pt-BR')}</td><td>{o.nome}</td><td>{o.contato}</td><td>{o.descricao}<br/>{o.cor}</td><td>{o.logo_url && <a href={o.logo_url} target="_blank" rel="noreferrer">Logo</a>}{o.logo_url && o.model_url && ' · '}{o.model_url && <a href={o.model_url} target="_blank" rel="noreferrer">Modelo 3D</a>}</td></tr>)}</tbody></table></div>}
  </section>;
}
