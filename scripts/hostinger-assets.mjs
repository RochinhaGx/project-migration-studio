import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// These pointers are rendered by the current catalog, shell and customizer.
export const HOSTINGER_PHOTO_POINTERS = [
  'custom-christmas-tree.jpg.asset.json',
  '3dtech-logo-new.png.asset.json',
  'hero-desktop.png.asset.json',
  'hero-mobile.png.asset.json',
  'custom-order-background.jpg.asset.json',
  'custom-keychain.jpg.asset.json',
  'custom-cabletag.jpg.asset.json',
  'custom-articulated.jpg.asset.json',
  'custom-nameplate.jpg.asset.json',
];

export function verifyHostingerPhotos(root, publicDirectory = 'public') {
  const available = new Set(readdirSync(resolve(root, 'src/assets')));
  const photos = HOSTINGER_PHOTO_POINTERS.map(name => {
    if (!available.has(name)) throw new Error(`Foto não encontrada: ${name}`);
    const metadata = JSON.parse(readFileSync(resolve(root, 'src/assets', name), 'utf8'));
    if (typeof metadata.url !== 'string' || !/^\/__l5e\/assets-v1\/[a-f0-9-]+\/[^/]+$/.test(metadata.url)) {
      throw new Error(`Endereço inválido da foto: ${name}`);
    }
    const path = resolve(root, publicDirectory, metadata.url.slice(1));
    if (!existsSync(path) || readFileSync(path).byteLength === 0) {
      throw new Error(`Foto ausente na publicação: ${name}. Inclua as fotos em public antes de publicar.`);
    }
    return path;
  });
  const variants = JSON.parse(readFileSync(resolve(root, 'src/lib/image-variants.json'), 'utf8'));
  for (const group of Object.values(variants)) {
    for (const variant of group) {
      const path = resolve(root, publicDirectory, variant.url.slice(1));
      if (!existsSync(path) || readFileSync(path).byteLength === 0) throw new Error('Versão leve de foto ausente na publicação.');
    }
  }
  return photos;
}