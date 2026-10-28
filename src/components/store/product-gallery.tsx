import { lazy, Suspense, useState } from 'react';
import { Box, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreImage } from './store-image';
const ModelViewer = lazy(() => import('./model-viewer'));

type Media = { kind: 'photo' | 'video'; src: string };

export function ProductGallery({ images, video, model, name, color, hex }: { images: string[]; video?: string | null; model?: string | null; name: string; color: string; hex?: string | undefined }) {
  const photos = images.length ? images : ['/produto-sem-foto.svg'];
  // Vídeo sempre logo após a foto de capa.
  const media: Media[] = [{ kind: 'photo', src: photos[0]! }, ...(video ? [{ kind: 'video' as const, src: video }] : []), ...photos.slice(1).map(src => ({ kind: 'photo' as const, src }))];
  const count = media.length;
  const [selected, setSelected] = useState(0);
  const [view3d, setView3d] = useState(false);
  const pick = (index: number) => { setSelected((index + count) % count); setView3d(false); };
  const current = media[selected] ?? media[0]!;
  return <div>
    <div className="product-gallery-stage" onKeyDown={e => { if (e.key === 'ArrowRight') pick(selected + 1); if (e.key === 'ArrowLeft') pick(selected - 1); }}>
      {view3d && model ? <Suspense fallback={<div className="model-loading">Carregando visualizador…</div>}><ModelViewer url={model} color={color} hex={hex} onClose={() => setView3d(false)} /></Suspense>
        : current.kind === 'video' ? <video key={current.src} className="detail-main-image product-gallery-video" autoPlay muted loop playsInline controls preload="auto" poster={photos[0]} src={current.src} aria-label={`Vídeo de ${name}`} />
        : <StoreImage src={current.src} alt={name} className="detail-main-image" width={700} height={700} sizes="(max-width:600px) 100vw, 50vw" loading="eager" />}
      {!view3d && count > 1 && <div className="gallery-arrows"><Button variant="outline" size="icon" title="Mídia anterior" aria-label="Mídia anterior" onClick={() => pick(selected - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon" title="Próxima mídia" aria-label="Próxima mídia" onClick={() => pick(selected + 1)}><ChevronRight /></Button></div>}
    </div>
    <div className="thumbnails" aria-label="Fotos e vídeo do produto">
      {media.map((m, i) => m.kind === 'video'
        ? <Button key={`v-${i}`} variant="outline" className="video-thumbnail" aria-label={`Vídeo de ${name}`} title="Vídeo do produto" aria-pressed={!view3d && selected === i} onClick={() => pick(i)} style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
            <video src={`${m.src}#t=0.5`} muted playsInline preload="metadata" poster={photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} aria-hidden />
            <Play style={{ position: 'absolute' }} />
          </Button>
        : <Button key={`${m.src}-${i}`} variant="outline" aria-label={`Imagem ${i + 1}`} aria-pressed={!view3d && selected === i} onClick={() => pick(i)}><StoreImage src={m.src} alt="" width={65} height={65} sizes="65px" loading="lazy" /></Button>)}
    </div>
    <Button variant="outline" className="view-model-button" disabled={!model} onClick={() => setView3d(!view3d)}><Box />{model ? (view3d ? 'Ver fotos' : 'Visualizar em 3D') : 'Modelo 3D ainda não disponível'}</Button>
  </div>;
}
