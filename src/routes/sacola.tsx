import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from '@/lib/notify';
import { createCheckout } from '@/lib/checkout.functions';
import { CreditCard, ShoppingBag, Plus, Minus, Trash2, ArrowUpRight, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/components/store/store-provider';
import { PixCheckout } from '@/components/store/pix-checkout';
import { pageHead, money, whatsapp } from '@/lib/store-schema';
import { estimateFreight, maskCep, type Freight } from '@/lib/payment-rules';

export const Route = createFileRoute('/sacola')({ head: () => pageHead('Sua sacola', 'Revise suas peças, calcule o frete e pague com Pix ou cartão na 3D Tech Studio.'), component: BagPage });

function BagPage() {
  const { bag, update, remove } = useStore();
  const [paying, setPaying] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [cep, setCep] = useState('');
  const [freight, setFreight] = useState<Freight[] | null>(null);
  const [pick, setPick] = useState(0);
  const pay = async () => { setPaying(true); try { const r = await createCheckout({ data: { items: bag.map((x) => ({ id: x.product.id, quantity: x.quantity, color: x.color, material: x.material as 'PLA' | 'PETG' })) } }); window.location.href = r.url; } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro no pagamento'); setPaying(false); } };
  const total = bag.reduce((s, x) => s + Number(x.product.preco) * x.quantity, 0);
  const ship = freight?.[pick];
  const grand = total + (ship?.price ?? 0);
  const openPix = () => { if (!ship) { toast.error('Calcule a entrega primeiro', { description: 'Digite seu CEP e escolha PAC ou SEDEX para pagar com Pix.' }); document.getElementById('cep')?.focus(); return; } setPixOpen(true); };
  const text = `Olá, 3D Tech Studio! Gostaria de encomendar:\n${bag.map((x) => `${x.quantity}× ${x.product.nome} (${x.color}, ${x.material}) — ${money(Number(x.product.preco) * x.quantity)}`).join('\n')}\nTotal dos produtos: ${money(total)}.${ship ? `\nEntrega: ${ship.service} para o CEP ${cep} (${money(ship.price)}, ${ship.days}).` : ''}\nPodemos confirmar disponibilidade e entrega?`;
  return <section className="page-width form-page !max-w-none"><span className="eyebrow">SUAS ESCOLHAS</span><h1 className="page-title">Sua sacola</h1>{!bag.length ? <div className="empty-state"><ShoppingBag size={40} /><h2>Ainda há espaço para uma ideia.</h2><p>Encontre a próxima peça para o seu dia a dia.</p><Button asChild><Link to="/catalogo">Explorar catálogo <ArrowUpRight /></Link></Button></div> : <div className="bag-layout"><div>{bag.map((x, i) => <div className="bag-item" key={`${x.product.id}-${x.color}-${x.material}`}><img src={x.product.imagens[0]} alt={x.product.nome} /><div><Link to="/produto/$id" params={{ id: x.product.id }}><h3>{x.product.nome}</h3></Link><p>{x.color} · {x.material}</p><div className="quantity"><Button variant="outline" size="icon" aria-label={`Diminuir ${x.product.nome}`} onClick={() => update(i, -1)}><Minus /></Button><span>{x.quantity}</span><Button variant="outline" size="icon" aria-label={`Aumentar ${x.product.nome}`} onClick={() => update(i, 1)}><Plus /></Button></div></div><div className="flex flex-col items-end justify-between"><strong>{money(Number(x.product.preco) * x.quantity)}</strong><Button variant="ghost" size="icon" title="Remover produto" aria-label={`Remover ${x.product.nome}`} onClick={() => remove(i)}><Trash2 /></Button></div></div>)}</div>
    <aside className="bag-summary"><h2>Resumo do pedido</h2><div className="summary-line"><span>Produtos</span><span>{money(total)}</span></div>
      <div className="freight-box"><label htmlFor="cep">Calcular entrega (CEP)</label><div className="freight-row"><input id="cep" inputMode="numeric" maxLength={9} placeholder="00000-000" value={cep} onChange={(e) => { setCep(maskCep(e.target.value)); setFreight(null); }} /><Button variant="outline" onClick={() => { const f = estimateFreight(cep); setFreight(f); setPick(0); if (!f) toast.error('CEP inválido', { description: 'Digite os 8 números do seu CEP.' }); }}>Calcular</Button></div>{freight && <div className="freight-options" role="radiogroup" aria-label="Opções de entrega">{freight.map((f, i) => <button type="button" key={f.service} role="radio" aria-checked={pick === i} className={pick === i ? 'freight-option selected' : 'freight-option'} onClick={() => setPick(i)}><span><strong>{f.service}</strong><small>{f.days}</small></span><span>{money(f.price)}</span></button>)}<small className="freight-note">Estimativa pelos Correios a partir do CEP 06817-000. O valor final é confirmado no pedido.</small></div>}</div>
      <div className="summary-line"><span>Entrega</span><span>{ship ? money(ship.price) : 'A combinar'}</span></div><div className="summary-line total"><strong>Total</strong><strong>{money(grand)}</strong></div>
      <small>Pague na hora com Pix (frete incluído) ou com cartão de crédito.</small>
      <Button className="w-full h-12 mb-3" onClick={openPix}><QrCode />Pagar com Pix</Button>
      <Button variant="outline" className="w-full h-12 mb-3" disabled={paying} onClick={pay}><CreditCard />{paying ? 'Abrindo pagamento…' : 'Pagar com cartão'}</Button>
      <Button asChild variant="ghost" className="w-full h-12"><a href={whatsapp(text)} target="_blank" rel="noreferrer">Enviar pedido pelo WhatsApp <ArrowUpRight /></a></Button>
      <Button asChild variant="ghost" className="mt-3 w-full"><Link to="/catalogo">Continuar explorando</Link></Button></aside>
    <PixCheckout open={pixOpen} onOpenChange={setPixOpen} cep={cep} ship={ship} total={grand} /></div>}</section>;
}
