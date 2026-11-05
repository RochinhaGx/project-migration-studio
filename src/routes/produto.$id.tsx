import { createFileRoute,Link,notFound,useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Product } from '@/lib/catalog.functions';
import { useState } from 'react';
import { ProductGallery } from '@/components/store/product-gallery';
import { ChevronRight,ShoppingBag,MessageCircle,Check,Plus,X } from 'lucide-react';
import { configuredPrice,productOptions } from '@/lib/product-configuration';
import type { ItemConfiguration } from '@/lib/store-schema';
import { toast } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { productQuery } from '@/lib/catalog-query';
import { pageHead,money,whatsapp } from '@/lib/store-schema';
import { useStore } from '@/components/store/store-provider';
import { RouteError,RouteMissing } from '@/components/store/route-states';
type Cor={nome:string;hex:string;ajuste?:number|null};
export const Route=createFileRoute('/produto/$id')({head:({loaderData})=>{const p=loaderData as Product|undefined;return pageHead(p?.nome??'Produto',p?.descricao??'Peças impressas em 3D da 3D Tech Studio.');},loader:async({context,params})=>{const p=await context.queryClient.ensureQueryData(productQuery(params.id));if(!p)throw notFound();return p;},component:ProductPage,errorComponent:RouteError,notFoundComponent:RouteMissing});
function ProductPage(){const {id}=Route.useParams();const {data:p}=useSuspenseQuery(productQuery(id));const {add}=useStore();const navigate=useNavigate();const [pick,setPick]=useState('');const [material,setMaterial]=useState('PLA');const [size,setSize]=useState('');const [slots,setSlots]=useState<string[]>([]);if(!p)return <RouteMissing/>;
const cores=((p.cores as Cor[]|null)??[]).length?(p.cores as Cor[]):[{nome:'Preto',hex:'#1A1A1A'}];const color=cores.some(c=>c.nome===pick)?pick:cores[0]?.nome??'Preto';const colorHex=cores.find(c=>c.nome===color)?.hex;const materials=p.materiais??['PLA'];const selectedMaterial=materials.includes(material)?material:materials[0]??'PLA';
const {variacoes}=productOptions(p);const tamanhos=variacoes.tamanhos;const tamanho=tamanhos.some(t=>t.nome===size)?size:tamanhos[0]?.nome;const kit=variacoes.montagem;const pecas=kit.ativo?slots.filter(n=>kit.pecas.some(x=>x.nome===n)).slice(0,kit.vagas):[];
const configuration:ItemConfiguration={...(tamanho&&{tamanho}),...(kit.ativo&&{pecas})};const price=configuredPrice(p,color,configuration);const missing=kit.ativo&&pecas.length===0;
const details=[`${color}`,selectedMaterial,tamanho,pecas.length?`peças: ${pecas.join(', ')}`:''].filter(Boolean).join(' · ');
return <div className="page-width"><div className="breadcrumb"><Link to="/catalogo">Catálogo</Link><ChevronRight size={12}/><span>{p.categoria}</span><ChevronRight size={12}/><span>{p.nome}</span></div><div className="detail-layout"><ProductGallery images={p.imagens} video={p.video_url} model={p.modelo_3d} name={p.nome} color={color} hex={colorHex}/><div className="detail-content"><span className="eyebrow">{p.categoria.toUpperCase()} · IMPRESSO EM 3D</span><h1>{p.nome}</h1><p>{p.descricao}</p><div className="detail-price">{money(price)}</div><div className="detail-controls">
<div><label>Cor · {color}</label><div className="swatches">{cores.map(c=><Button key={c.nome} aria-label={`Cor ${c.nome}`} title={c.ajuste?`${c.nome} (+${money(c.ajuste)})`:c.nome} onClick={()=>setPick(c.nome)} className={color===c.nome?'selected':''} style={{background:c.hex}} variant="ghost">{color===c.nome&&<Check size={13} className="swatch-check"/>}</Button>)}</div></div>
{tamanhos.length>0&&<div><label>Tamanho · {tamanho}</label><div className="material-options">{tamanhos.map(t=><Button key={t.nome} variant={t.nome===tamanho?'secondary':'outline'} onClick={()=>setSize(t.nome)}>{t.nome}{t.preco!=null&&` · ${money(t.preco)}`}</Button>)}</div></div>}
<div><label>Material</label><div className="material-options">{materials.map(m=><Button key={m} variant={m===selectedMaterial?'secondary':'outline'} onClick={()=>setMaterial(m)}>{m}</Button>)}</div></div>
{kit.ativo&&<div className="kit-builder"><label>{kit.titulo||'Monte o seu'} · {pecas.length}/{kit.vagas} vagas</label>
<div className="kit-slots">{Array.from({length:kit.vagas},(_,i)=><button type="button" key={i} className={pecas[i]?'kit-slot filled':'kit-slot'} aria-label={pecas[i]?`Remover ${pecas[i]} da vaga ${i+1}`:`Vaga ${i+1} vazia`} onClick={()=>pecas[i]&&setSlots(pecas.filter((_,j)=>j!==i))}>{pecas[i]?<><span>{pecas[i]}</span><X size={12}/></>:<span>{i+1}</span>}</button>)}</div>
<small className="text-muted-foreground">Toque numa peça para colocá-la na próxima vaga. Toque na vaga para tirar.</small>
<div className="kit-pieces">{kit.pecas.map(x=><Button key={x.nome} type="button" variant="outline" size="sm" disabled={pecas.length>=kit.vagas} onClick={()=>setSlots([...pecas,x.nome])}><Plus/>{x.nome}{x.preco>0&&` +${money(x.preco)}`}</Button>)}</div></div>}
</div><div className="detail-actions"><Button disabled={missing} onClick={()=>{add(p,color,selectedMaterial,configuration);toast.success('Adicionado à sacola',{description:`${p.nome} · ${details}`,image:p.imagens[0],actionLabel:'Ver sacola',onAction:()=>void navigate({to:'/sacola'})});}}><ShoppingBag/> {missing?'Escolha as peças':'Adicionar à sacola'}</Button><Button variant="outline" asChild><a href={whatsapp(`Olá, 3D Tech Studio! Tenho interesse em ${p.nome} (${details}), por ${money(price)}.`)} target="_blank" rel="noreferrer"><MessageCircle/> Comprar pelo WhatsApp</a></Button></div><h3 className="mb-2 text-base">Detalhes da peça</h3><dl className="specs">{Object.entries(p.especificacoes??{}).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl></div></div></div>;}
