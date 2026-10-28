import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Film, Box, X, Plus, Trash2, Save, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Sparkles } from 'lucide-react';
import { generateDescription } from '@/lib/ai-description.functions';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { productSchema, type ProductInput } from '@/lib/store-schema';
import type { Product } from '@/lib/catalog.functions';

type Media = { path?: string; file?: File; preview: string };
const MAX = 20 * 1024 * 1024;
const MAX_BIG = 500 * 1024 * 1024;
const PRESET_COLORS = [{ nome: 'Branco', hex: '#F5F5F5' }, { nome: 'Preto', hex: '#1A1A1A' }, { nome: 'Cinza', hex: '#8A8F98' }, { nome: 'Dourado', hex: '#C9A227' }, { nome: 'Inox', hex: '#B8BCC2' }];


async function signed(path: string) {
  if (path.startsWith('/') || path.startsWith('https://')) return path;
  const { data } = await supabase.storage.from('product-media').createSignedUrl(path, 3600);
  return data?.signedUrl ?? '';
}
async function upload(file: File, contentType?: string) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-media').upload(path, file, contentType ? { contentType } : undefined);
  if (error) throw new Error(`Falha ao enviar ${file.name}.`);
  return path;
}

export function ProductForm({ product, onSave, onClose, categories = [] }: { categories?: string[]; product: Product | null; onSave: (row: ProductInput) => Promise<void>; onClose: () => void }) {
  const [nome, setNome] = useState(product?.nome ?? '');
  const [descricao, setDescricao] = useState(product?.descricao ?? '');
  const [categoria, setCategoria] = useState(product?.categoria ?? 'Decoração');
  const [preco, setPreco] = useState(product ? String(product.preco) : '');
  const [materiais, setMateriais] = useState<string[]>(product?.materiais ?? ['PLA']);
  const [destaque, setDestaque] = useState(product?.destaque ?? false);
  const [ativo, setAtivo] = useState(product?.ativo ?? true);
  const [cores, setCores] = useState<{ nome: string; hex: string }[]>(() => { const c = (product?.cores as { nome: string; hex: string }[] | null) ?? []; return c.length ? c : [{ nome: 'Preto', hex: '#1A1A1A' }]; });
  const [aiBusy, setAiBusy] = useState(false);
  const genFn = useServerFn(generateDescription);
  async function writeWithAi() {
    if (!nome.trim() || !categoria.trim()) return setError('Preencha nome e categoria antes de gerar a descrição.');
    setAiBusy(true); setError('');
    try {
      const especificacoes = Object.fromEntries(specs.filter((x) => x.k.trim() && x.v.trim()).map((x) => [x.k.trim(), x.v.trim()]));
      const r = await genFn({ data: { nome, categoria, materiais, cores: cores.map((c) => c.nome).filter(Boolean), especificacoes } });
      setDescricao(r.text);
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível gerar a descrição.'); }
    finally { setAiBusy(false); }
  }
  const [specs, setSpecs] = useState<{ k: string; v: string }[]>(() => {
    const e = Object.entries((product?.especificacoes as Record<string, string>) ?? {});
    return e.length ? e.map(([k, v]) => ({ k, v: String(v) })) : [{ k: 'Dimensões', v: '' }, { k: 'Peso', v: '' }];
  });
  const [images, setImages] = useState<Media[]>([]);
  const [video, setVideo] = useState<Media | null>(null);
  const [model, setModel] = useState<{ path?: string; file?: File } | null>(product?.modelo_3d ? { path: product.modelo_3d } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!product) return;
    void Promise.all(product.imagens.map(async (p) => ({ path: p, preview: await signed(p) }))).then(setImages);
    const videoPath = product.video_url;
    if (videoPath) void signed(videoPath).then((preview) => setVideo({ path: videoPath, preview }));
  }, [product]);

  function addImages(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const big = list.find((f) => f.size > MAX);
    if (big) return setError(`${big.name} passa de 20 MB.`);
    setError('');
    setImages((cur) => [...cur, ...list.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 20));
  }
  function move(i: number, d: number) {
    setImages((cur) => { const n = [...cur]; const j = i + d; const a = n[i]; const b = n[j]; if (j < 0 || !a || !b) return cur; n[i] = b; n[j] = a; return n; });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!materiais.length) return setError('Selecione pelo menos um material.');
    setBusy(true);
    try {
      const imagens: string[] = [];
      for (const m of images) { const path = m.file ? await upload(m.file) : m.path; if (!path) throw new Error('Imagem inválida.'); imagens.push(path); }
      let video_url: string | null = null;
      if (video) video_url = video.file ? await upload(video.file) : video.path ?? null;
      let modelo_3d: string | null = null;
      if (model) modelo_3d = model.file ? await upload(model.file, 'application/octet-stream') : model.path ?? null;
      const especificacoes = Object.fromEntries(specs.filter((s) => s.k.trim() && s.v.trim()).map((s) => [s.k.trim(), s.v.trim()]));
      const row = productSchema.parse({ nome, descricao, categoria, preco: preco.replace(',', '.'), materiais, imagens, video_url, modelo_3d, especificacoes, cores: cores.filter((c) => c.nome.trim()).map((c) => ({ nome: c.nome.trim(), hex: c.hex })), destaque, ativo });
      await onSave(row);
    } catch (err) {
      setError(err instanceof Error ? (err.message.startsWith('[') ? 'Confira nome, categoria e preço.' : err.message) : 'Não foi possível salvar.');
    } finally { setBusy(false); }
  }

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label="Editar produto">
      <div className="admin-modal-body pf">
        <div className="modal-heading"><h2>{product ? 'Editar produto' : 'Nova peça'}</h2><Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}><X /></Button></div>
        <form className="studio-form" onSubmit={submit}>
          <section className="pf-section">
            <h3>Fotos</h3>
            <p className="pf-hint">A primeira foto é a capa. Arraste para cá ou clique para adicionar.</p>
            <div className={`pf-images ${drag ? 'is-drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); addImages(e.dataTransfer.files); }}>
              {images.map((m, i) => (
                <div className="pf-thumb" key={m.preview + i}>
                  {m.preview ? <img src={m.preview} alt={`Foto ${i + 1}`} /> : <span>Foto</span>}
                  {i === 0 && <span className="pf-badge"><Star size={12} />Capa</span>}
                  <div className="pf-thumb-actions">
                    <button type="button" aria-label="Mover para esquerda" onClick={() => move(i, -1)} disabled={i === 0}><ArrowLeft size={14} /></button>
                    <button type="button" aria-label="Remover foto" onClick={() => setImages((c) => c.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                    <button type="button" aria-label="Mover para direita" onClick={() => move(i, 1)} disabled={i === images.length - 1}><ArrowRight size={14} /></button>
                  </div>
                </div>
              ))}
              <button type="button" className="pf-add" onClick={() => imgInput.current?.click()}><ImagePlus /><span>Adicionar fotos</span></button>
              <input ref={imgInput} hidden type="file" accept="image/*" multiple aria-label="Adicionar fotos" onChange={(e) => { if (e.target.files) addImages(e.target.files); e.target.value = ''; }} />
            </div>
          </section>

          <section className="pf-section">
            <h3>Informações</h3>
            <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={150} placeholder="Ex.: Suporte duplo para controle PS5" /></label>
            <div className="pf-desc-head"><span>Descrição</span><Button type="button" variant="outline" size="sm" disabled={aiBusy} onClick={writeWithAi}><Sparkles />{aiBusy ? 'Gerando…' : 'Gerar descrição com IA'}</Button></div>
            <label className="sr-only-label"><span className="sr-only">Descrição</span><textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={5000} rows={4} placeholder="Conte para o cliente o que torna essa peça especial." /></label>
            <div className="form-row">
              <label>Categoria<input value={categoria} onChange={(e) => setCategoria(e.target.value)} required maxLength={80} list="pf-categories" /><datalist id="pf-categories">{categories.map((c) => <option key={c}>{c}</option>)}</datalist></label>
              <label>Preço<div className="pf-price"><span>R$</span><input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} required placeholder="0,00" /></div></label>
            </div>
          </section>

          <section className="pf-section">
            <h3>Materiais disponíveis</h3>
            <div className="pf-chips">
              {['PLA', 'PETG'].map((m) => { const on = materiais.includes(m); return (
                <button type="button" key={m} aria-pressed={on} className={`pf-chip ${on ? 'is-on' : ''}`} onClick={() => setMateriais((c) => on ? c.filter((x) => x !== m) : [...c, m])}>{m}</button>
              ); })}
            </div>
          </section>

          <section className="pf-section">
            <h3>Cores disponíveis</h3>
            <p className="pf-hint">O cliente só poderá escolher entre as cores cadastradas aqui.</p>
            <div className="flex flex-wrap gap-2 mb-2" aria-label="Cores rápidas">{PRESET_COLORS.map((p) => { const on = cores.some((c) => c.nome.toLowerCase() === p.nome.toLowerCase()); return <Button key={p.nome} type="button" variant={on ? 'default' : 'outline'} size="sm" aria-pressed={on} onClick={() => setCores((l) => on ? (l.length > 1 ? l.filter((c) => c.nome.toLowerCase() !== p.nome.toLowerCase()) : l) : [...l.filter((c) => c.nome.trim()), p].slice(0, 20))}><span aria-hidden className="inline-block size-3 rounded-full border border-border" style={{ background: p.hex }} />{p.nome}</Button>; })}</div>
            <div className="pf-specs">
              {cores.map((c, i) => (
                <div className="pf-color" key={i}>
                  <input type="color" aria-label="Tom da cor" value={c.hex} onChange={(e) => setCores((l) => l.map((x, j) => j === i ? { ...x, hex: e.target.value.toUpperCase() } : x))} />
                  <input aria-label="Nome da cor" placeholder="Ex.: Preto fosco" value={c.nome} maxLength={40} onChange={(e) => setCores((l) => l.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover cor" disabled={cores.length === 1} onClick={() => setCores((l) => l.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" disabled={cores.length >= 20} onClick={() => setCores((l) => [...l, { nome: '', hex: '#FF6B35' }])}><Plus />Adicionar cor</Button>
            </div>
          </section>

          <section className="pf-section">
            <h3>Especificações</h3>
            <div className="pf-specs">
              {specs.map((s, i) => (
                <div className="pf-spec" key={i}>
                  <input aria-label="Característica" placeholder="Ex.: Dimensões" value={s.k} onChange={(e) => setSpecs((c) => c.map((x, j) => j === i ? { ...x, k: e.target.value } : x))} maxLength={60} />
                  <input aria-label="Valor" placeholder="Ex.: 12 × 8 × 15 cm" value={s.v} onChange={(e) => setSpecs((c) => c.map((x, j) => j === i ? { ...x, v: e.target.value } : x))} maxLength={200} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover especificação" onClick={() => setSpecs((c) => c.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setSpecs((c) => [...c, { k: '', v: '' }])}><Plus />Adicionar especificação</Button>
            </div>
          </section>

          <section className="pf-section pf-media">
            <div>
              <h3>Vídeo</h3>
              {video ? <div className="pf-file"><video src={video.preview} controls muted /><Button type="button" variant="ghost" size="sm" onClick={() => setVideo(null)}><Trash2 />Remover vídeo</Button></div>
                : <label className="pf-drop"><Film /><span>Enviar vídeo (até 500 MB)</span><input hidden type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > MAX_BIG) return setError('O vídeo passa de 500 MB.'); setVideo({ file: f, preview: URL.createObjectURL(f) }); }} /></label>}
            </div>
            <div>
              <h3>Modelo 3D</h3>
              {model ? <div className="pf-file pf-model"><Box /><span>{model.file?.name ?? 'Modelo cadastrado'}</span><Button type="button" variant="ghost" size="sm" onClick={() => setModel(null)}><Trash2 />Remover</Button></div>
                : <label className="pf-drop"><Box /><span>Enviar STL, OBJ ou GLB (até 500 MB)</span><input hidden type="file" accept=".stl,.obj,.glb" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > MAX_BIG || !/\.(stl|obj|glb)$/i.test(f.name)) return setError('Envie um modelo STL, OBJ ou GLB de até 500 MB.'); setModel({ file: f }); }} /></label>}
            </div>
          </section>

          <section className="pf-section pf-toggles">
            <label className="pf-switch"><input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /><span>Visível na loja</span></label>
            <label className="pf-switch"><input type="checkbox" checked={destaque} onChange={(e) => setDestaque(e.target.checked)} /><span>Produto em destaque</span></label>
          </section>

          {error && <p role="alert" className="error-text">{error}</p>}
          <div className="pf-footer"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}><Save />{busy ? 'Salvando…' : 'Salvar produto'}</Button></div>
        </form>
      </div>
    </div>
  );
}
