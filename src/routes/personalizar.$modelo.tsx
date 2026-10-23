import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { getCustomModel } from '@/lib/customizer';
import { pageHead } from '@/lib/store-schema';

const Studio = lazy(() => import('@/components/store/customizer-studio'));

export const Route = createFileRoute('/personalizar/$modelo')({
  loader: ({ params }) => { const model = getCustomModel(params.modelo); if (!model) throw notFound(); return { model }; },
  head: ({ loaderData }) => loaderData ? pageHead(`Personalizar ${loaderData.model.nome}`, `${loaderData.model.descricao} Escolha texto, fonte, tamanho e cores com visualização 3D.`) : { meta: [{ title: 'Modelo não encontrado | 3D Tech Studio' }, { name: 'robots', content: 'noindex' }] },
  notFoundComponent: () => <section className="page-width form-page"><h1 className="page-title">Modelo não encontrado</h1><Link to="/personalizar">Ver modelos</Link></section>,
  component: StudioPage,
});

function StudioPage() {
  const { model } = Route.useLoaderData();
  const fallback = <div className="studio-loading">Abrindo estúdio 3D…</div>;
  return <ClientOnly fallback={fallback}><Suspense fallback={fallback}><Studio model={model} /></Suspense></ClientOnly>;
}
