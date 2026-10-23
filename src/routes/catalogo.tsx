import { createFileRoute } from '@tanstack/react-router';
import { productsQuery } from '@/lib/catalog-query';
import { Catalog } from '@/components/store/catalog';
import { pageHead } from '@/lib/store-schema';
import { RouteError,RouteMissing } from '@/components/store/route-states';
export const Route=createFileRoute('/catalogo')({head:()=>pageHead('Catálogo','Encontre peças de decoração, suportes gaming, luminárias e objetos de Natal impressos em 3D.'),loader:({context})=>context.queryClient.ensureQueryData(productsQuery),component:()=> <Catalog/>,errorComponent:RouteError,notFoundComponent:RouteMissing});
