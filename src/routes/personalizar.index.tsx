import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, Box } from 'lucide-react';
import { CUSTOM_MODELS } from '@/lib/customizer';
import { StoreImage } from '@/components/store/store-image';
import { pageHead } from '@/lib/store-schema';

export const Route = createFileRoute('/personalizar/')({
  head: () => pageHead('Personalize sua peça', 'Escolha um modelo, digite seu nome, escolha fonte e cores e veja sua peça impressa em 3D em tempo real.'),
  component: Gallery,
});

function Gallery() {
  return <section className="page-width custom-gallery">
    <div className="gallery-heading"><div><span className="eyebrow"><Box size={15}/> STUDIO / PERSONALIZAR</span><h1>Sua peça.<br/>Seu jeito.</h1></div><p>Escolha a forma. Dê um nome.<br/>Encontre suas cores.</p></div>
    
    <div className="custom-grid">
      {CUSTOM_MODELS.map(m => <Link key={m.slug} to="/personalizar/$modelo" params={{ modelo: m.slug }} className="custom-card">
        <StoreImage src={m.image} sizes="(max-width:640px) 50vw, (max-width:1000px) 50vw, 25vw" alt={m.nome} loading="lazy" width={816} height={816} />
        <div className="custom-card-foot"><div><h2>{m.nome}</h2><p>{m.descricao}</p></div><span aria-label="Personalizar"><ArrowUpRight size={20}/></span></div>
      </Link>)}
    </div>
  </section>;
}
