import { OrderSuccess } from '@/components/store/order-success';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Clock, RefreshCw, WifiOff, XCircle } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { confirmCheckout } from '@/lib/checkout.functions';
import { getPixStatus } from '@/lib/pix.functions';
import { pageHead, money } from '@/lib/store-schema';

export const Route = createFileRoute('/pedido-confirmado')({
  validateSearch: (s) => z.object({ session_id: z.string().optional(), pedido: z.string().uuid().optional() }).parse(s),
  head: () => pageHead('Pedido confirmado', 'Acompanhe a confirmação do seu pagamento na 3D Tech Studio.'),
  component: Confirmed,
});

type Result = { paid: boolean; cancelled: boolean; motivo: 'expirado' | 'recusado' | null; codigo: string | null; total: number };

function Confirmed() {
  const { session_id, pedido } = Route.useSearch();
  const q = useQuery<Result>({
    queryKey: ['order-confirmation', session_id, pedido],
    enabled: !!session_id || !!pedido,
    queryFn: async () => {
      if (pedido) { const r = await getPixStatus({ data: { orderId: pedido } }); return { paid: r.paid, cancelled: !!r.motivo || r.status === 'cancelado', motivo: r.motivo, codigo: r.codigo, total: r.total }; }
      const r = await confirmCheckout({ data: { sessionId: session_id! } });
      return { paid: r.paid, cancelled: r.pedido?.status === 'cancelado', motivo: null, codigo: r.pedido?.codigo ?? null, total: r.pedido?.total ?? 0 };
    },
    refetchInterval: (x) => (x.state.data?.paid || x.state.data?.cancelled ? false : 5000),
  });
  const d = q.data;
  if (d?.paid) return <section className="page-width form-page"><OrderSuccess description="Pagamento aprovado! Sua peça entrou na fila de impressão.">{d.codigo && <p>Pedido #{d.codigo} · {money(d.total)}</p>}<Button asChild><Link to="/catalogo">Continuar explorando</Link></Button></OrderSuccess></section>;
  if (q.isError) return <section className="page-width form-page"><div className="empty-state"><WifiOff size={44} /><h2>Falha de conexão</h2><p>Não conseguimos verificar seu pagamento agora. Se você já pagou, ele não se perde: confira sua internet e tente de novo.</p><Button onClick={() => void q.refetch()} disabled={q.isFetching}><RefreshCw />{q.isFetching ? 'Verificando…' : 'Verificar novamente'}</Button></div></section>;
  const title = q.isLoading ? 'Confirmando pagamento…' : d?.motivo === 'recusado' ? 'Pagamento recusado' : d?.motivo === 'expirado' ? 'Pix expirado' : d?.cancelled ? 'Pagamento não concluído' : 'Aguardando confirmação do pagamento';
  const text = d?.motivo === 'recusado' ? 'O pagamento não foi aprovado e nada foi cobrado. Volte à sacola para gerar um novo QR Code ou pagar com cartão.'
    : d?.motivo === 'expirado' ? 'O prazo para pagar este Pix acabou e nada foi cobrado. Volte à sacola para gerar um novo QR Code.'
    : d?.cancelled ? 'O pagamento foi cancelado. Volte à sacola para tentar novamente.'
    : 'Se pagou com Pix, a confirmação pode levar alguns instantes.';
  return <section className="page-width form-page"><div className="empty-state">{d?.cancelled ? <XCircle size={44} /> : <Clock size={44} />}<h2>{title}</h2>{d?.codigo && <p>Pedido #{d.codigo} · {money(d.total)}</p>}<p>{text}</p><Button asChild><Link to={d?.cancelled ? '/sacola' : '/catalogo'}>{d?.cancelled ? 'Gerar novo QR Code na sacola' : 'Continuar explorando'}</Link></Button></div></section>;
}
