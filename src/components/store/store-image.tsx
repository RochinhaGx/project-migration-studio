import type { ImgHTMLAttributes } from 'react';
import variants from '@/lib/image-variants.json';

const images: Record<string, { width: number; url: string }[]> = variants;
export function StoreImage({ src, sizes = '100vw', onError, loading = 'lazy', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const versions = src ? images[src] : undefined;
  return <img {...props} loading={loading} src={versions?.at(-1)?.url ?? src ?? '/produto-sem-foto.svg'} srcSet={versions?.map(v => `${v.url} ${v.width}w`).join(', ')} sizes={versions ? sizes : undefined} decoding="async" onError={event => { const image = event.currentTarget; if (!image.src.endsWith('/produto-sem-foto.svg')) { image.removeAttribute('srcset'); image.src = '/produto-sem-foto.svg'; } onError?.(event); }} />;
}
export function imageSourceSet(src: string) {
  return images[src]?.map(v => `${v.url} ${v.width}w`).join(', ') ?? src;
}