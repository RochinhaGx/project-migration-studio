// Optional pointers may be absent or contain {} while an asset is replaced.
// Glob imports let absent files fall back without breaking module resolution.
const modelAssets = import.meta.glob<unknown>('../assets/custom-*.jpg.asset.json', {
  eager: true,
  import: 'default',
});

export function customizerAssetUrl(metadata: unknown): string {
  if (typeof metadata !== 'object' || metadata === null || !('url' in metadata)) {
    return '/produto-sem-foto.svg';
  }
  const url = metadata.url;
  return typeof url === 'string' && url.trim().length > 0
    ? url.trim()
    : '/produto-sem-foto.svg';
}

const modelImage = (name: string) => customizerAssetUrl(modelAssets[`../assets/custom-${name}.jpg.asset.json`]);

export type ShapeKind = 'keychain' | 'cabletag' | 'articulated' | 'penholder' | 'frame' | 'piggy' | 'nameplate' | 'planter';
export type CustomModel = { slug: ShapeKind; nome: string; descricao: string; image: string; texto: string; tampa: boolean };

export const CUSTOM_MODELS: CustomModel[] = [
  { slug: 'keychain', nome: 'Chaveiro com nome', descricao: 'Nome em relevo sobre base com argola.', image: modelImage('keychain'), texto: 'Luna', tampa: false },
  { slug: 'cabletag', nome: 'Etiqueta de cabo', descricao: 'Identifique seus cabos com estilo.', image: modelImage('cabletag'), texto: 'JOHN', tampa: true },
  { slug: 'articulated', nome: 'Nome articulado', descricao: 'Letras unidas que se movimentam.', image: modelImage('articulated'), texto: 'ISABELLA', tampa: false },
  { slug: 'nameplate', nome: 'Placa de mesa', descricao: 'Seu nome em destaque na mesa.', image: modelImage('nameplate'), texto: 'OLIVER', tampa: false },
];

export const FONTS = [
  { id: 'helvetiker', nome: 'Moderna', url: '/fonts/helvetiker_bold.typeface.json' },
  { id: 'optimer', nome: 'Elegante', url: '/fonts/optimer_bold.typeface.json' },
  { id: 'gentilis', nome: 'Clássica', url: '/fonts/gentilis_bold.typeface.json' },
  { id: 'droid', nome: 'Serifada', url: '/fonts/droid_serif_bold.typeface.json' },
] as const;

export const FILAMENTS = [
  { nome: 'Preto', hex: '#1A1A1A' }, { nome: 'Branco', hex: '#F5F5F5' }, { nome: 'Cinza', hex: '#8A8F98' },
  { nome: 'Vermelho', hex: '#D7263D' }, { nome: 'Laranja', hex: '#F2711C' }, { nome: 'Amarelo', hex: '#F4C430' },
  { nome: 'Verde', hex: '#3FA34D' }, { nome: 'Azul claro', hex: '#5DADE2' }, { nome: 'Azul', hex: '#2453D6' },
  { nome: 'Roxo', hex: '#7B3FBF' }, { nome: 'Rosa', hex: '#E86FA8' }, { nome: 'Bege', hex: '#D9C7A3' },
] as const;

export const getCustomModel = (slug: string) => CUSTOM_MODELS.find(m => m.slug === slug);
/** Scene units are centimetres; dimensions are shown in mm (1 unit = 10 mm). */
export const toMm = (units: number) => Math.round(units * 100) / 10;
