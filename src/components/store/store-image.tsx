import type { ImgHTMLAttributes } from 'react';
import variants from '@/lib/image-variants.json';

const images: Record<string, { width: number; url: string }[]> = variants;
export function StoreImage({ src, sizes = '100vw', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const versions = src ? images[src] : undefined;
  return <img {...props} src={versions?.at(-1)?.url ?? src ?? '/produto-sem-foto.svg'} srcSet={versions?.map(v => `${v.url} ${v.width}w`).join(', ')} sizes={versions ? sizes : undefined} decoding="async" />;
}
export function imageSourceSet(src: string) {
  return images[src]?.map(v => `${v.url} ${v.width}w`).join(', ') ?? src;
}