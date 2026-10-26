import { verifyHostingerPhotos } from './hostinger-assets.mjs';

try {
  const photos = verifyHostingerPhotos(process.cwd());
  console.log(`Hostinger: ${photos.length} fotos incluídas em public.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Não foi possível conferir as fotos.');
  process.exitCode = 1;
}