import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, Text3D, ContactShadows } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Box3, Group, Vector3 } from 'three';
import { ChristmasTree } from './christmas-tree';
import { treeNames } from '@/lib/christmas-tree';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowUpRight, Download, Image, Share2, RotateCcw, Box, Type, Ruler, MoveHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { capturePreview, downloadFile, exportModelSTL } from '@/lib/customizer-export';
import { Button } from '@/components/ui/button';
import { FILAMENTS, FONTS, type CustomModel, type ShapeKind } from '@/lib/customizer';
import { submitCustomOrder } from '@/lib/catalog.functions';
import { orderSchema, whatsapp } from '@/lib/store-schema';

type Config = { texto: string; font: string; spacing: number; size: number; text: string; base: string; cap: string; year: string };
type Dims = { x: number; y: number; z: number };

function Letters({ c, depth, color, z = 0 }: { c: Config; depth: number; color: string; z?: number }) {
  return <Text3D font={c.font} size={c.size} height={depth} letterSpacing={c.spacing} curveSegments={6} bevelEnabled bevelSize={0.02} bevelThickness={0.02} position={[0, 0, z]} castShadow>
    {c.texto || ' '}<meshStandardMaterial color={color} roughness={0.55} />
  </Text3D>;
}

/** Measures the text block, then builds the model-specific base around it. */
function Piece({ kind, c, onDims, modelRef }: { kind: ShapeKind; c: Config; onDims: (d: Dims) => void; modelRef: React.RefObject<Group | null> }) {
  const textRef = useRef<Group>(null);
  const whole = useRef<Group>(null);
  const [box, setBox] = useState({ w: 4, h: 1, cx: 0, cy: 0 });
  const [offset, setOffset] = useState<[number, number, number]>([0, 0, 0]);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!textRef.current || !whole.current) return;
      whole.current.updateWorldMatrix(true, true); const b = new Box3().setFromObject(textRef.current);
      whole.current.worldToLocal(b.min); whole.current.worldToLocal(b.max);
      const s = b.getSize(new Vector3()); const ctr = b.getCenter(new Vector3());
      setBox({ w: Math.max(s.x, 0.5), h: Math.max(s.y, 0.5), cx: ctr.x, cy: ctr.y });
    });
    return () => cancelAnimationFrame(id);
  }, [c.texto, c.font, c.spacing, c.size]);
  useEffect(() => {
    const id = requestAnimationFrame(() => { if (whole.current) { whole.current.updateWorldMatrix(true, true); const b = new Box3().setFromObject(whole.current); whole.current.worldToLocal(b.min); whole.current.worldToLocal(b.max); const s = b.getSize(new Vector3()); const ctr = b.getCenter(new Vector3()); onDims({ x: s.x, y: s.y, z: s.z }); setOffset(prev => Math.abs(prev[0] + ctr.x) + Math.abs(prev[1] + ctr.y) + Math.abs(prev[2] + ctr.z) > 0.001 ? [-ctr.x, -ctr.y, -ctr.z] : prev); } });
    return () => cancelAnimationFrame(id);
  });
  const pad = c.size * 0.35; const W = box.w + pad * 2; const H = box.h + pad * 2;
  const mat = (color: string) => <meshStandardMaterial color={color} roughness={0.6} />;
  let base: React.ReactNode = null; let textDepth = 0.3; let textZ = 0.15; let rotX = 0;
  switch (kind) {
    case 'keychain':
      base = <><mesh position={[box.cx, box.cy, 0]}><boxGeometry args={[W, H, 0.3]} />{mat(c.base)}</mesh>
        <mesh position={[box.cx - W / 2 - 0.25, box.cy, 0]}><torusGeometry args={[0.35, 0.13, 12, 32]} />{mat(c.base)}</mesh></>; break;
    case 'cabletag':
      base = <><mesh position={[box.cx, box.cy, 0]}><boxGeometry args={[W, H, 0.3]} />{mat(c.base)}</mesh>
        <mesh position={[box.cx, box.cy - H / 2 - 0.35, -0.2]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.4, 0.12, 12, 32]} />{mat(c.cap)}</mesh></>; break;
    case 'articulated': textDepth = 0.7; textZ = -0.35; base = null; break;
    case 'penholder':
      textDepth = 1.6; textZ = -0.8;
      base = <group><mesh position={[box.cx, box.cy - box.h / 2 - 0.2, 0]}><boxGeometry args={[W, 0.4, 3.6]} />{mat(c.base)}</mesh>{[-1, 1].map(x => <group key={x} position={[box.cx + x * W / 4, box.cy + 0.3, -0.9]}><mesh><cylinderGeometry args={[0.65, 0.65, 2, 32, 1, true]}/><meshStandardMaterial color={c.base} side={2}/></mesh><mesh><cylinderGeometry args={[0.52, 0.52, 2, 32, 1, true]}/><meshStandardMaterial color={c.base} side={2}/></mesh><mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1, 0]}><ringGeometry args={[0.52, 0.65, 32]}/><meshStandardMaterial color={c.base} side={2}/></mesh></group>)}</group>; break;
    case 'frame':
      base = <group position={[box.cx, box.cy + 3.3, 0]}>{[-1, 1].map(sign => <group key={sign}><mesh position={[sign * (Math.max(W, 5) / 2 - 0.3), 0, 0]}><boxGeometry args={[0.6, 6.5, 0.4]}/>{mat(c.base)}</mesh><mesh position={[0, sign * 2.95, 0]}><boxGeometry args={[Math.max(W, 5), 0.6, 0.4]}/>{mat(c.base)}</mesh></group>)}<mesh position={[0, -3.35, 0]}><boxGeometry args={[Math.max(W, 5) + 0.6, 0.3, 2]}/>{mat(c.base)}</mesh></group>; textZ = 0.1; textDepth = 0.25; break;
    case 'piggy':
      textDepth = 1.8; textZ = -0.9;
      base = <mesh position={[box.cx, box.cy + box.h / 2 + 0.05, 0]}><boxGeometry args={[box.w * 0.25, 0.12, 0.3]} />{mat(c.cap)}</mesh>; break;
    case 'nameplate':
      base = <mesh position={[box.cx, box.cy - box.h / 2 - 0.25, 0]}><boxGeometry args={[W, 0.5, 1.6]} />{mat(c.base)}</mesh>; textZ = -0.15; break;
    case 'planter': {
      const r = Math.max(W / 2.6, 2);
      base = <group position={[box.cx, box.cy, -r]}>
        <mesh><cylinderGeometry args={[r, r * 0.85, Math.max(H * 2.2, 4), 48, 1, true]} /><meshStandardMaterial color={c.base} roughness={0.6} side={2} /></mesh>
        <mesh position={[0, -Math.max(H * 2.2, 4) / 2, 0]}><cylinderGeometry args={[r * 0.85, r * 0.85, 0.2, 48]} />{mat(c.base)}</mesh>
        <mesh position={[0, Math.max(H * 2.2, 4) / 2 - 0.4, 0]}><cylinderGeometry args={[r * 0.95, r * 0.95, 0.4, 48]} />{mat(c.cap)}</mesh>
      </group>; textZ = 0; textDepth = 0.25; break;
    }
  }
  return <group ref={modelRef} rotation={[rotX, 0, 0]}><group position={offset}><group ref={whole}>
    {base}
    <group ref={textRef}>{kind === 'christmas-tree'
      ? <ChristmasTree text={c.texto} year={c.year} font={c.font} size={c.size} spacing={c.spacing} primary={c.base} secondary={c.text} star={c.cap}/>
      : <Letters c={c} depth={textDepth} color={c.text} z={textZ} />}</group>
  </group></group></group>;
}

function Swatches({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="studio-field"><span>{label}</span><div className="studio-swatches" role="radiogroup" aria-label={label}>
    {FILAMENTS.map((f, i) => <Button variant="ghost" size="icon" className={`filament-${i}`} key={f.hex} type="button" role="radio" aria-checked={value === f.hex} title={f.nome} aria-label={f.nome} onClick={() => onChange(f.hex)} />)}
  </div></div>;
}

const nameOf = (hex: string) => FILAMENTS.find(f => f.hex === hex)?.nome ?? hex;

export default function CustomizerStudio({ model }: { model: CustomModel }) {
  const [c, setC] = useState<Config>({ texto: model.texto, font: FONTS[0].url, spacing: 0.02, size: 1, text: model.slug === 'christmas-tree' ? FILAMENTS[3].hex : FILAMENTS[1].hex, base: model.slug === 'christmas-tree' ? FILAMENTS[6].hex : FILAMENTS[3].hex, cap: model.slug === 'christmas-tree' ? FILAMENTS[5].hex : FILAMENTS[0].hex, year: '2026' });
  const [dims, setDims] = useState<Dims>({ x: 0, y: 0, z: 0 });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [link, setLink] = useState('');
  const modelRef = useRef<Group>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [photo, setPhoto] = useState('');
  const [shareText, setShareText] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [review, setReview] = useState<{ texto: string; fonte: string; espacamento: string; tamanho: string; cores: string; dimensoes: string } | null>(null);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  const submit = useServerFn(submitCustomOrder);
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setC(prev => ({ ...prev, [k]: v }));
  const fmt = (u: number) => `${u.toFixed(1)} cm`;
  const cm = (u: number) => u.toFixed(1);
  const fontName = FONTS.find(f => f.url === c.font)?.nome ?? '';

  async function order(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const resumo = `Modelo personalizado: ${model.nome}\nTexto: ${c.texto}${model.slug === 'christmas-tree' ? `\nAno: ${c.year || 'Sem ano'}` : ''}\nFonte: ${fontName}\nEspaçamento: ${c.spacing.toFixed(2)} · Tamanho: ${c.size.toFixed(1)}\nCores — texto: ${nameOf(c.text)}, base: ${nameOf(c.base)}${model.tampa ? `, detalhe: ${nameOf(c.cap)}` : ''}\nDimensões: ${cm(dims.x)} × ${cm(dims.y)} × ${cm(dims.z)} cm`;
      const data = orderSchema.parse({ nome: f.get('nome'), contato: f.get('contato'), descricao: resumo, cor: nameOf(c.text).slice(0, 30), arquivo: null, logo_arquivo: null, dimensoes: { unidade: 'cm', largura: cm(dims.x), altura: cm(dims.y), profundidade: cm(dims.z) } });
      if (!modelRef.current || !canvasRef.current || dims.x === 0) throw new Error('Aguarde a peça carregar.');
      const filename = `${model.slug}-${c.texto.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30)}`;
      const stl = new File([exportModelSTL(modelRef.current)], `${filename}.stl`, { type: 'application/octet-stream' });
      const image = new File([await capturePreview(canvasRef.current)], `${filename}.png`, { type: 'image/png' });
      const path = `${crypto.randomUUID()}.stl`;
      const { error: uploadError } = await supabase.storage.from('custom-models').upload(path, stl);
      if (uploadError) throw new Error('Não foi possível salvar o STL. Tente novamente.');
      data.arquivo = path;
      await submit({ data });
      const message = `Olá! Sou ${data.nome}. Gostaria de um orçamento para esta peça.\n${resumo}\nContato: ${data.contato}\nAnexos: prévia PNG e modelo STL para avaliação de produção.`;
      setFiles([image, stl]); setPhoto(URL.createObjectURL(image)); setShareText(message);
      setReview({
        texto: model.slug === 'christmas-tree' ? `${treeNames(c.texto).join(' · ')}${c.year ? ` · ${c.year}` : ''}` : c.texto, fonte: fontName,
        espacamento: c.spacing.toFixed(2), tamanho: c.size.toFixed(1),
        cores: `texto: ${nameOf(c.text)}, base: ${nameOf(c.base)}${model.tampa ? `, detalhe: ${nameOf(c.cap)}` : ''}`,
        dimensoes: `${cm(dims.x)} × ${cm(dims.y)} × ${cm(dims.z)} cm`,
      });
      setLink(whatsapp(message));
      if (navigator.canShare?.({ files: [image, stl] }) && navigator.share) {
        navigator.share({ files: [image, stl], text: message, title: model.nome }).catch(() => {});
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Confira seus dados.'); } finally { setBusy(false); }
  }

  async function share() {
    setShareNote('');
    if (!navigator.canShare?.({ files }) || !navigator.share) {
      setShareNote('Baixe a foto e o STL e anexe os dois na conversa do WhatsApp.'); return;
    }
    try { await navigator.share({ files, text: shareText, title: model.nome }); }
    catch (err) { if (!(err instanceof DOMException && err.name === 'AbortError')) setShareNote('Compartilhamento indisponível. Baixe os arquivos e anexe no WhatsApp.'); }
  }
  if (link && review) return <section className="page-width form-page"><div className="personalized-result"><span className="eyebrow">ORÇAMENTO ENVIADO</span><h1 className="page-title">Quase lá — envie no WhatsApp</h1><p className="page-intro">Seu pedido já foi registrado. Toque em <strong>Enviar no WhatsApp</strong> para recebermos sua personalização com a foto e o arquivo 3D.</p><img src={photo} alt={`Prévia de ${c.texto}`} width={600} height={450}/><dl className="review-summary"><div><dt>Texto</dt><dd>{review.texto}</dd></div><div><dt>Fonte</dt><dd>{review.fonte}</dd></div><div><dt>Espaçamento</dt><dd>{review.espacamento}</dd></div><div><dt>Tamanho</dt><dd>{review.tamanho}</dd></div><div><dt>Cores</dt><dd>{review.cores}</dd></div><div><dt>Dimensões</dt><dd>{review.dimensoes}</dd></div></dl><div className="result-actions"><Button asChild size="lg"><a href={link} target="_blank" rel="noreferrer">Enviar no WhatsApp <ArrowUpRight /></a></Button>{navigator.canShare?.({ files }) && <Button variant="outline" onClick={share}><Share2/>Compartilhar foto + STL</Button>}</div><details className="result-files"><summary>Baixar os arquivos (opcional)</summary><div className="result-actions">{files.map(file => <Button key={file.name} variant="outline" onClick={() => downloadFile(file)}><Download/>Baixar {file.name.endsWith('.stl') ? 'STL' : 'imagem'}</Button>)}</div><p className="text-muted-foreground">O STL representa esta prévia; encaixes, partes ocas e articulações precisam de revisão antes da impressão.</p></details>{shareNote && <p role="status">{shareNote}</p>}</div></section>;

  return <section className="studio-layout">
    <aside className="studio-panel">
      <Link to="/personalizar" className="studio-back"><ArrowLeft size={14} /> Modelos</Link>
      <span className="eyebrow"><Box size={14}/> SUA PEÇA / 3D</span><h1>{model.nome}</h1>
      {model.slug === 'christmas-tree' ? <><label className="studio-field"><span><Type size={15}/> Nomes da família</span><textarea value={c.texto.replace(/\*/g, '\n')} rows={4} maxLength={160} onChange={e => set('texto', e.target.value)} aria-label="Nomes da família" /></label><label className="studio-field"><span>Ano</span><input value={c.year} inputMode="numeric" maxLength={4} onChange={e => set('year', e.target.value.replace(/\D/g, ''))} aria-label="Ano da árvore" /></label></> : <label className="studio-field"><span><Type size={15}/> Nome / texto</span><input value={c.texto} maxLength={16} onChange={e => set('texto', e.target.value)} aria-label="Texto da peça" /></label>}
      <div className="studio-field"><span>Fonte</span><div className="studio-fonts">{FONTS.map(f => <Button variant="outline" key={f.id} type="button" aria-pressed={c.font === f.url} onClick={() => set('font', f.url)}>{f.nome}</Button>)}</div></div>
      <label className="studio-field"><span>Espaçamento entre letras <b>{c.spacing.toFixed(2)}</b></span><input type="range" min={-0.1} max={0.5} step={0.01} value={c.spacing} onChange={e => set('spacing', Number(e.target.value))} /></label>
      <label className="studio-field"><span>Tamanho <b>{c.size.toFixed(1)}</b></span><input type="range" min={0.5} max={2} step={0.1} value={c.size} onChange={e => set('size', Number(e.target.value))} /></label>
    </aside>
    <div className="studio-stage">
      <div className="stage-label"><span><Box size={14}/> {c.texto || model.nome}</span><Button variant="outline" size="icon" title="Restaurar personalização" aria-label="Restaurar personalização" onClick={() => setC({ texto: model.texto, font: FONTS[0].url, spacing: 0.02, size: 1, text: model.slug === 'christmas-tree' ? FILAMENTS[3].hex : FILAMENTS[1].hex, base: model.slug === 'christmas-tree' ? FILAMENTS[6].hex : FILAMENTS[3].hex, cap: model.slug === 'christmas-tree' ? FILAMENTS[5].hex : FILAMENTS[0].hex, year: '2026' })}><RotateCcw/></Button></div>
      <Canvas shadows frameloop="demand" gl={{ preserveDrawingBuffer: true }} onCreated={({ gl }) => { canvasRef.current = gl.domElement; }} camera={{ position: [0, 3, 14], fov: 40 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#f4f4f2']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 6]} intensity={2} castShadow />
        <Environment resolution={128}><Lightformer intensity={2} position={[0, 5, 2]} scale={[10, 10, 1]} /><Lightformer intensity={1} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} /></Environment>
        <Suspense fallback={null}><Piece modelRef={modelRef} kind={model.slug} c={c} onDims={d => setDims(prev => Math.abs(prev.x - d.x) + Math.abs(prev.y - d.y) + Math.abs(prev.z - d.z) > 0.001 ? d : prev)} /></Suspense>
        <ContactShadows position={[0, -3, 0]} opacity={0.35} blur={2.5} scale={20} />
        <OrbitControls makeDefault enablePan={false} minDistance={4} maxDistance={25} />
      </Canvas>
      <p className="studio-hint">Arraste para girar · role para aproximar</p>
    </div>
    <aside className="studio-panel">
      <div className="studio-field"><span><Ruler size={15}/> Dimensões (cm)</span>
        <p className="studio-dims" aria-live="polite">L {fmt(dims.x)} · A {fmt(dims.y)} · P {fmt(dims.z)}</p></div>
      <Swatches label={model.slug === 'christmas-tree' ? "Cor dos nomes alternados" : "Cor do texto"} value={c.text} onChange={v => set('text', v)} />
      {model.slug !== 'articulated' && <Swatches label={model.slug === 'christmas-tree' ? "Cor principal dos nomes" : "Cor da base"} value={c.base} onChange={v => set('base', v)} />}
      {model.tampa && <Swatches label={model.slug === 'christmas-tree' ? "Cor da estrela" : "Cor do detalhe"} value={c.cap} onChange={v => set('cap', v)} />}
      <form className="studio-order" onSubmit={order}>
        <input name="nome" required minLength={2} maxLength={100} placeholder="Seu nome" autoComplete="name" aria-label="Seu nome" />
        <input name="contato" required minLength={8} maxLength={100} placeholder="WhatsApp ou e-mail" aria-label="WhatsApp ou e-mail" />
        {error && <p role="alert" className="error-text">{error}</p>}
        <Button type="submit" size="lg" disabled={busy || !c.texto.trim() || dims.x === 0}>{busy ? 'Preparando arquivos…' : 'Orçamento pelo WhatsApp'}<Share2 /></Button>
      </form>
    </aside>
  </section>;
}
