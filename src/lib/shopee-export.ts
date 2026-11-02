import type { Product } from './catalog.functions';

export type ShopeeDetails = { description: string; weight: string; stock: string; cover: string; category: string };
export function shopeeImageUrl(value: string, origin: string) {
  if (!value || value.includes('produto-sem-foto')) return '';
  try {
    const url = new URL(value, origin);
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)) return '';
    return url.href;
  } catch { return ''; }
}
export function shopeeRow(product: Product, details: ShopeeDetails, origin: string): (string | number)[] {
  const weight = Number(details.weight.replace(',', '.'));
  const stock = Number(details.stock);
  if (!details.description.trim()) throw new Error(`${product.nome}: preencha a descrição.`);
  if (!Number.isFinite(weight) || weight <= 0) throw new Error(`${product.nome}: informe o peso em kg.`);
  if (!details.stock.trim() || !Number.isInteger(stock) || stock <= 0) throw new Error(`${product.nome}: informe um estoque inteiro positivo.`);
  if (Number(product.preco) <= 0) throw new Error(`${product.nome}: o preço deve ser maior que zero.`);
  const cover = shopeeImageUrl(details.cover, origin);
  if (!cover) throw new Error(`${product.nome}: informe uma imagem de capa HTTPS pública.`);
  if (details.category && !/^\d+$/.test(details.category)) throw new Error(`${product.nome}: use o código numérico da categoria Shopee, não o nome da categoria da loja.`);
  const row: (string | number)[] = Array.from({ length: 52 }, () => '');
  row[0] = details.category; row[1] = product.nome; row[2] = details.description.trim(); row[3] = product.id;
  row[10] = Number(product.preco); row[11] = stock; row[17] = cover;
  product.imagens.filter(image => image !== details.cover).slice(0, 8).forEach((image, index) => { row[18 + index] = shopeeImageUrl(image, origin); });
  row[26] = weight;
  row[30] = 'Ativado';
  return row;
}

export async function exportShopee(products: Product[], details: Record<string, ShopeeDetails>, origin: string) {
  const { supabase } = await import('@/integrations/supabase/client');
  const mediaUrl = async (path: string) => {
    if (!path || path.startsWith('/') || /^https?:\/\//.test(path)) return path;
    const { data, error } = await supabase.storage.from('product-media').createSignedUrl(path, 60 * 60 * 24 * 7);
    if (error || !data) throw new Error('Não foi possível preparar as fotos para a Shopee.');
    return data.signedUrl;
  };
  const rows = await Promise.all(products.map(async product => {
    const values = details[product.id];
    if (!values) throw new Error('Confira os dados de todos os produtos selecionados.');
    const images = await Promise.all(product.imagens.map(mediaUrl));
    return shopeeRow({ ...product, imagens: images }, { ...values, cover: await mediaUrl(values.cover) }, origin);
  }));
  const { default: ExcelJS } = await import('exceljs');
  const response = await fetch('/templates/shopee-basic.xlsx');
  if (!response.ok) throw new Error('Não foi possível carregar o formulário da Shopee.');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await response.arrayBuffer());
  const sheet = workbook.getWorksheet('Modelo');
  if (!sheet || sheet.getCell('B1').value !== 'ps_product_name|1|0') throw new Error('O formulário da Shopee é inválido.');
  rows.forEach((values, index) => {
    const row = sheet.getRow(7 + index);
    values.forEach((value, column) => { row.getCell(column + 1).value = value || null; });
    row.font = { name: 'Arial', size: 11 };
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'shopee-novos-produtos.xlsx'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}