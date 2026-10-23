import { LogoUpload } from '@/components/store/logo-upload';
import { OrderSuccess } from '@/components/store/order-success';
import { createFileRoute,Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { submitCustomOrder } from '@/lib/catalog.functions';
import { useState } from 'react';
import { Upload,ArrowUpRight,CheckCircle2,ImagePlus,Box,Cpu,Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { pageHead,orderSchema,whatsapp } from '@/lib/store-schema';
export const Route=createFileRoute('/sob-medida')({head:()=>pageHead('Pedido sob medida','Personalize uma peça impressa em 3D. Envie seu modelo, sua logo e medidas em centímetros para solicitar um orçamento.'),component:CustomPage});
function CustomPage(){
 const submitOrder=useServerFn(submitCustomOrder);
 const [file,setFile]=useState<File|null>(null);const [logo,setLogo]=useState<File|null>(null);
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [sent,setSent]=useState(false);const [link,setLink]=useState('');
 function chooseFile(selected:File|undefined,kind:'model'|'logo'){
  setError('');if(!selected)return;
  const valid=kind==='model'?/\.(stl|obj|3mf)$/i:/\.(png|jpg|jpeg|webp|pdf)$/i;
  if(!valid.test(selected.name)||selected.size>20*1024*1024){setError(kind==='model'?'Envie STL, OBJ ou 3MF de até 20 MB.':'Envie PNG, JPG, WEBP ou PDF de até 20 MB.');return;}
  if(kind==='model')setFile(selected);else setLogo(selected);
 }
 async function upload(selected:File){const ext=selected.name.split('.').pop()?.toLowerCase();const path=`${crypto.randomUUID()}.${ext}`;const {error:uploadError}=await supabase.storage.from('custom-models').upload(path,selected,{contentType:selected.type||'application/octet-stream'});if(uploadError)throw new Error('Não foi possível enviar o arquivo. Tente novamente.');return path;}
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError('');setBusy(true);try{
  const f=new FormData(e.currentTarget);
  const data=orderSchema.parse({nome:f.get('nome'),contato:f.get('contato'),descricao:f.get('descricao'),cor:f.get('cor'),arquivo:null,logo_arquivo:null,dimensoes:{unidade:'cm',largura:String(f.get('largura')??''),altura:String(f.get('altura')??''),profundidade:String(f.get('profundidade')??'')}});
  if(file)data.arquivo=await upload(file);if(logo)data.logo_arquivo=await upload(logo);
  await submitOrder({data});
  const dimensions=['largura','altura','profundidade'].map(n=>`${n}: ${data.dimensoes[n]||'a combinar'} cm`).join(', ');
  setLink(whatsapp(`Olá! Sou ${data.nome}. Enviei um pedido sob medida para a 3D Tech Studio.\nProjeto: ${data.descricao}\nCor: ${data.cor}\nMedidas: ${dimensions}\nLogo: ${logo?'enviada com o pedido':'não enviada'}\nContato: ${data.contato}`));setSent(true);
 }catch(err){setError(err instanceof Error?err.message:'Confira os campos do formulário.');}finally{setBusy(false);}}
 return <section className="page-width form-page"><div className="custom-heading"><span className="eyebrow"><Cpu size={16}/> STUDIO / SOB MEDIDA</span><h1 className="page-title">Sua ideia, em 3D.</h1><p className="page-intro">Uma peça com a sua identidade. Conte o que você tem em mente — ou <Link to="/personalizar" className="text-primary underline">personalize um modelo pronto em 3D</Link>.</p></div>{sent?<OrderSuccess description="Seu projeto foi recebido. Vamos combinar os detalhes do orçamento."><Button asChild><a href={link} target="_blank" rel="noreferrer">Conversar sobre o projeto <ArrowUpRight/></a></Button></OrderSuccess>:<form className="studio-form" onSubmit={submit}>
 <fieldset className="order-group"><legend><span>01</span>Seu projeto</legend><label>Descrição do projeto<textarea name="descricao" required minLength={10} maxLength={2000} rows={5} placeholder="O que vamos criar? Conte a função da peça e os detalhes que você quer."/></label>
 <div className="form-row"><label className="order-upload"><Box/><span><strong>{file?.name??'Adicionar modelo 3D'}</strong><small>STL, OBJ ou 3MF · Opcional · Até 20 MB</small></span>{file?<Check size={18}/>:<Upload size={18}/>}<input type="file" accept=".stl,.obj,.3mf" aria-label="Arquivo 3D" onChange={e=>chooseFile(e.target.files?.[0],'model')}/></label>
 <LogoUpload file={logo} onChange={selected=>chooseFile(selected,'logo')} onRemove={()=>setLogo(null)}/></div></fieldset>
 <fieldset className="order-group"><legend><span>02</span>Medidas e acabamento</legend><div className="form-row three">{['largura','altura','profundidade'].map(n=><label key={n}>{n.charAt(0).toUpperCase()+n.slice(1)} (cm)<input name={n} type="number" min="0.1" max="1000" step="0.1" placeholder="0,0" aria-label={`${n} em cm`}/></label>)}</div><label>Cor desejada<select name="cor">{['Preto','Branco','Terracota','Azul','Verde','Outra / a combinar'].map(c=><option key={c}>{c}</option>)}</select></label></fieldset>
 <fieldset className="order-group"><legend><span>03</span>Seu contato</legend><div className="form-row"><label>Seu nome<input name="nome" required minLength={2} maxLength={100} autoComplete="name" placeholder="Como podemos te chamar?"/></label><label>WhatsApp ou e-mail<input name="contato" required minLength={8} maxLength={100} placeholder="Seu contato"/></label></div></fieldset>
 {error&&<p role="alert" className="error-text">{error}</p>}<Button type="submit" size="lg" className="order-submit" disabled={busy}>{busy?'Enviando projeto…':'Pedir orçamento'}<ArrowUpRight/></Button></form>}</section>;
}
