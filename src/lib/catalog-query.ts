import { queryOptions } from '@tanstack/react-query';
import { getProducts,getProduct } from './catalog.functions';
export const productsQuery=queryOptions({queryKey:['products'],queryFn:()=>getProducts(),staleTime:60000});
export const productQuery=(id:string)=>queryOptions({queryKey:['product',id],queryFn:()=>getProduct({data:{id}}),staleTime:60000});
