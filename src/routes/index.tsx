import { createFileRoute } from '@tanstack/react-router';
import { productsQuery } from '@/lib/catalog-query';
import { Catalog } from '@/components/store/catalog';
import { pageHead } from '@/lib/store-schema';
import { RouteError,RouteMissing } from '@/components/store/route-states';
export const Route=createFileRoute('/')({head:()=>pageHead('Design que ganha forma','Objetos únicos impressos em 3D. Explore decoração, gaming, iluminação e peças sob medida da 3D Tech Studio.'),loader:({context})=>context.queryClient.ensureQueryData(productsQuery),component:()=> <Catalog home/>,errorComponent:RouteError,notFoundComponent:RouteMissing});
