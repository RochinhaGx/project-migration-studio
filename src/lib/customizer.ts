import keychain from '@/assets/custom-keychain.jpg.asset.json';
import cabletag from '@/assets/custom-cabletag.jpg.asset.json';
import articulated from '@/assets/custom-articulated.jpg.asset.json';
import penholder from '@/assets/custom-penholder.jpg.asset.json';
import frame from '@/assets/custom-frame.jpg.asset.json';
import piggy from '@/assets/custom-piggy.jpg.asset.json';
import nameplate from '@/assets/custom-nameplate.jpg.asset.json';
import planter from '@/assets/custom-planter.jpg.asset.json';

export type ShapeKind = 'keychain' | 'cabletag' | 'articulated' | 'penholder' | 'frame' | 'piggy' | 'nameplate' | 'planter';
export type CustomModel = { slug: ShapeKind; nome: string; descricao: string; image: string; texto: string; tampa: boolean };

export const CUSTOM_MODELS: CustomModel[] = [
  { slug: 'keychain', nome: 'Chaveiro com nome', descricao: 'Nome em relevo sobre base com argola.', image: keychain.url, texto: 'Luna', tampa: false },
  { slug: 'cabletag', nome: 'Etiqueta de cabo', descricao: 'Identifique seus cabos com estilo.', image: cabletag.url, texto: 'JOHN', tampa: true },
  { slug: 'articulated', nome: 'Nome articulado', descricao: 'Letras unidas que se movimentam.', image: articulated.url, texto: 'ISABELLA', tampa: false },
  { slug: 'nameplate', nome: 'Placa de mesa', descricao: 'Seu nome em destaque na mesa.', image: nameplate.url, texto: 'OLIVER', tampa: false },
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
