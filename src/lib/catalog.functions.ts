import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { getRequest } from '@tanstack/react-start/server';
import { orderSchema,productSchema } from './store-schema';
export type Product=Database['public']['Tables']['produtos']['Row'];
function publicClient(){
 const url=process.env['SUPABASE_URL'];const key=process.env['SUPABASE_PUBLISHABLE_KEY'];if(!url||!key)throw new Error('Catálogo indisponível');
 return createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers});}}});
}
const NO_PHOTO='/produto-sem-foto.svg';
async function resolveMedia(client:ReturnType<typeof publicClient>,rows:Product[]){return Promise.all(rows.map(async p=>({...p,imagens:p.imagens.length?await Promise.all(p.imagens.map(async path=>{if(path.startsWith('/')||path.startsWith('https://'))return path;const {data}=await client.storage.from('product-media').createSignedUrl(path,3600);return data?.signedUrl??NO_PHOTO;})):[NO_PHOTO],modelo_3d:p.modelo_3d?(await client.storage.from('product-media').createSignedUrl(p.modelo_3d,3600)).data?.signedUrl??null:null,video_url:p.video_url&&!p.video_url.startsWith('https://')?(await client.storage.from('product-media').createSignedUrl(p.video_url,3600)).data?.signedUrl??null:p.video_url})));}
export const getProducts=createServerFn({method:'GET'}).handler(async()=>{const client=publicClient();const {data,error}=await client.from('produtos').select('*').eq('ativo',true).order('created_at',{ascending:false});if(error)throw new Error('Não foi possível carregar os produtos.');return resolveMedia(client,data??[]);});
export const getProduct=createServerFn({method:'GET'}).inputValidator((d)=>z.object({id:z.string().uuid()}).parse(d)).handler(async({data})=>{const client=publicClient();const {data:row,error}=await client.from('produtos').select('*').eq('id',data.id).eq('ativo',true).maybeSingle();if(error)throw new Error('Não foi possível carregar o produto.');if(!row)return null;return (await resolveMedia(client,[row]))[0];});
export const adminStatus=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{const {data,error}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(error)throw error;return Boolean(data);});
export const adminProducts=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{const {data:role}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(!role)throw new Error('Acesso não autorizado');const {data,error}=await context.supabase.from('produtos').select('*').order('created_at',{ascending:false});if(error)throw error;return data??[];});
export const adminCustomOrders=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{const {data:role}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(!role)throw new Error('Acesso não autorizado');const {data,error}=await context.supabase.from('pedidos_sob_medida').select('*').order('created_at',{ascending:false}).limit(300);if(error)throw new Error('Não foi possível carregar os orçamentos.');return Promise.all((data??[]).map(async o=>({...o,logo_url:o.logo_arquivo?(await context.supabase.storage.from('custom-models').createSignedUrl(o.logo_arquivo,3600)).data?.signedUrl??null:null,model_url:o.arquivo?(await context.supabase.storage.from('custom-models').createSignedUrl(o.arquivo,3600)).data?.signedUrl??null:null})));});
export const saveProducts=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(d=>z.object({id:z.string().uuid().optional(),rows:z.array(productSchema).min(1).max(500)}).parse(d)).handler(async({data,context})=>{const {data:role}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(!role)throw new Error('Acesso não autorizado');const first=data.rows[0];if(!first)throw new Error('Nenhum produto enviado');const result=data.id?await context.supabase.from('produtos').update(first).eq('id',data.id):await context.supabase.from('produtos').insert(data.rows);if(result.error)throw new Error(result.error.message);return {ok:true};});
export const deleteProduct=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(d=>z.object({id:z.string().uuid()}).parse(d)).handler(async({data,context})=>{const {data:role}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(!role)throw new Error('Acesso não autorizado');const {error}=await context.supabase.from('produtos').delete().eq('id',data.id);if(error)throw error;return {ok:true};});

export const submitCustomOrder=createServerFn({method:'POST'}).inputValidator(d=>orderSchema.parse(d)).handler(async({data})=>{
 const client=publicClient();const request=getRequest();const header=request.headers.get('authorization');let owner:string|null=null;
 if(header){if(!header.startsWith('Bearer '))throw new Error('Sessão inválida');const token=header.slice(7);const {data:identity,error}=await client.auth.getUser(token);if(error||!identity.user)throw new Error('Sua sessão expirou. Entre novamente.');owner=identity.user.id;}
 if(data.arquivo&&!/^[0-9a-f-]{36}\.(stl|obj|3mf)$/.test(data.arquivo))throw new Error('Arquivo inválido');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const address=request.headers.get('cf-connecting-ip')??request.headers.get('x-forwarded-for')?.split(',')[0]??'unknown';
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(address));
 const key=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 const {data:allowed,error:limitError}=await supabaseAdmin.rpc('claim_quote_slot',{client_key:key});
 if(limitError||!allowed)throw new Error('Aguarde alguns instantes antes de enviar outro orçamento.');
 const {data:order,error}=await supabaseAdmin.from('pedidos_sob_medida').insert({...data,owner_id:owner}).select('id').single();
 if(error||!order)throw new Error('Não foi possível enviar o pedido.');return {ok:true,id:order.id};
});
