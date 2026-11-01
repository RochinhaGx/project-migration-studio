import { verifyHostingerPhotos } from './hostinger-assets.mjs';
import { validateHostingerEnv } from './hostinger-env.mjs';
import { loadEnv } from 'vite';

try {
  const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
  const issues = validateHostingerEnv(env);
  if (issues.length) throw new Error(issues.join('\n'));
  const photos = verifyHostingerPhotos(process.cwd());
  console.log(`Hostinger: ${photos.length} fotos incluídas em public.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Não foi possível conferir as fotos.');
  process.exitCode = 1;
}