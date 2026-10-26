import { existsSync } from 'node:fs';
import { verifyHostingerPhotos } from './hostinger-assets.mjs';

try {
  if (!existsSync('.output/server/index.mjs')) {
    throw new Error('Hostinger: falta .output/server/index.mjs. Compile fora do Lovable com o preset node-server.');
  }
  verifyHostingerPhotos(process.cwd(), '.output/public');
  console.log('Hostinger: servidor Node e oito fotos presentes em .output.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Saída da publicação inválida.');
  process.exitCode = 1;
}