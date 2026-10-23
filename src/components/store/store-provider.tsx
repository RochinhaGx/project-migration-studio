import { createContext,useContext,useState,useEffect,type ReactNode } from 'react';
import type { Product } from '@/lib/catalog.functions';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
export type BagItem={product:Product;quantity:number;color:string;material:string};
type Store={bag:BagItem[];add:(p:Product,color:string,material:string)=>void;update:(index:number,delta:number)=>void;remove:(index:number)=>void;clear:()=>void;search:string;setSearch:(v:string)=>void;user:User|null};
const Context=createContext<Store|null>(null);
export function StoreProvider({children}:{children:ReactNode}){const router=useRouter();const queryClient=useQueryClient();const [bag,setBag]=useState<BagItem[]>([]);const [search,setSearch]=useState('');const [user,setUser]=useState<User|null>(null);
 useEffect(()=>{void supabase.auth.getUser().then(({data})=>setUser(data.user));const {data}=supabase.auth.onAuthStateChange((event,session)=>{setUser(session?.user??null);if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_UPDATED'){void router.invalidate();if(session)void queryClient.invalidateQueries();}});return()=>data.subscription.unsubscribe();},[]);
 return <Context.Provider value={{bag,search,setSearch,user,add:(product,color,material)=>setBag(prev=>{const i=prev.findIndex(x=>x.product.id===product.id&&x.color===color&&x.material===material);return i<0?[...prev,{product,color,material,quantity:1}]:prev.map((x,j)=>j===i?{...x,quantity:Math.min(99,x.quantity+1)}:x);}),update:(index,delta)=>setBag(prev=>prev.map((x,i)=>i===index?{...x,quantity:Math.max(1,Math.min(99,x.quantity+delta))}:x)),remove:index=>setBag(prev=>prev.filter((_,i)=>i!==index)),clear:()=>setBag([])}}>{children}</Context.Provider>;
}
export function useStore(){const ctx=useContext(Context);if(!ctx)throw new Error('Store provider missing');return ctx;}
