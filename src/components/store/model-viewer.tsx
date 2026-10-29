import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { Maximize, Minimize, RotateCcw, Rotate3D, Grid2X2, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ModelViewer({ url, color, hex, onClose }: { url: string; color: string; hex?: string | undefined; onClose: () => void }) {
  const [object, setObject] = useState<Group | null>(null);
  const [error, setError] = useState('');
  const [wireframe, setWireframe] = useState(false);
  const [rotate, setRotate] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tone, setTone] = useState('');
  const controls = useRef<OrbitControlsType>(null);
  useEffect(() => {
    if (hex) { setTone(hex); return; }
    const token = ({ Preto: '--studio-ink', Branco: '--swatch-light', Terracota: '--primary', Azul: '--swatch-blue', Verde: '--swatch-green' } as Record<string, string>)[color] ?? '--studio-ink';
    setTone(getComputedStyle(document.documentElement).getPropertyValue(token).trim());
  }, [color, hex]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let disposed = false;
    let model: Group | null = null;
    setError('');
    setObject(null);
    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Arquivo indisponível.');
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 500 * 1024 * 1024) throw new Error('Modelo acima de 500 MB.');
        const ext = new URL(url, window.location.origin).pathname.split('.').pop()?.toLowerCase();
        model = new Group();
        if (ext === 'stl') {
          const geometry = new STLLoader().parse(buffer);
          geometry.computeVertexNormals();
          model.add(new Mesh(geometry, new MeshStandardMaterial()));
        } else if (ext === 'obj') {
          model.add(new OBJLoader().parse(new TextDecoder().decode(buffer)));
        } else if (ext === 'glb') {
          const gltf = await new GLTFLoader().parseAsync(buffer, '');
          model.add(gltf.scene);
        } else throw new Error('Formato 3D não suportado.');
        const box = new Box3().setFromObject(model);
        const size = box.getSize(new Vector3());
        const largest = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(largest) || largest <= 0) throw new Error('Modelo sem geometria válida.');
        const center = box.getCenter(new Vector3());
        const scale = 3 / largest;
        model.scale.setScalar(scale);
        model.position.copy(center.multiplyScalar(-scale));
        model.traverse(node => {
          if (node instanceof Mesh) {
            const old = Array.isArray(node.material) ? node.material : [node.material];
            old.forEach(material => material.dispose());
            node.material = new MeshStandardMaterial({ roughness: 0.55, metalness: 0.08 });
          }
        });
        if (!disposed) setObject(model);
      } catch (err) {
        if (!disposed) setError(err instanceof Error && err.name !== 'AbortError' ? err.message : 'Não foi possível carregar o modelo. Tente novamente.');
      } finally { clearTimeout(timer); }
    }
    void load();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
      model?.traverse(node => {
        if (node instanceof Mesh) {
          node.geometry.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach(material => material.dispose());
        }
      });
    };
  }, [url]);
  useEffect(() => {
    object?.traverse(node => {
      if (node instanceof Mesh && node.material instanceof MeshStandardMaterial) {
        node.material.wireframe = wireframe;
        if (tone) node.material.color.set(tone);
      }
    });
  }, [object, wireframe, tone]);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key); };
  }, [expanded]);
  function zoom(factor: number) {
    const control = controls.current;
    if (!control) return;
    const offset = control.object.position.clone().sub(control.target);
    offset.multiplyScalar(factor).clampLength(1.8, 15);
    control.object.position.copy(control.target).add(offset);
    control.update();
  }
  return <div className={`model-viewer ${expanded ? 'model-viewer-expanded' : ''}`} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label="Visualização 3D">
    <div className="model-toolbar"><span>Peça em 3D</span><div>
      <Button variant="ghost" size="icon" title="Girar automaticamente" aria-label="Girar automaticamente" aria-pressed={rotate} onClick={() => setRotate(!rotate)}><Rotate3D /></Button>
      <Button variant="ghost" size="icon" title="Mostrar malha" aria-label="Mostrar malha" aria-pressed={wireframe} onClick={() => setWireframe(!wireframe)}><Grid2X2 /></Button>
      <Button variant="ghost" size="icon" title="Aproximar" aria-label="Aproximar" onClick={() => zoom(0.8)}><Plus /></Button>
      <Button variant="ghost" size="icon" title="Afastar" aria-label="Afastar" onClick={() => zoom(1.25)}><Minus /></Button>
      <Button variant="ghost" size="icon" title="Restaurar vista" aria-label="Restaurar vista" onClick={() => controls.current?.reset()}><RotateCcw /></Button>
      <Button variant="ghost" size="icon" title={expanded ? 'Reduzir' : 'Ampliar'} aria-label={expanded ? 'Reduzir' : 'Ampliar'} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize /> : <Maximize />}</Button>
      <Button variant="ghost" size="icon" title="Voltar às fotos" aria-label="Voltar às fotos" onClick={onClose}><X /></Button>
    </div></div>
    <div className="model-stage">
      {error ? <div className="model-status" role="alert">{error}</div> : <>
        {!object && <div className="model-status" role="status">Carregando peça…</div>}
        <Canvas camera={{ position: [4, 3, 5], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: true }} fallback={<div className="model-status">Seu navegador não suporta visualização 3D.</div>}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 6, 3]} intensity={2} />
          <Environment resolution={128}><Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} /><Lightformer intensity={1} position={[-5, 1, 2]} scale={[8, 5, 1]} rotation-y={Math.PI / 2} /></Environment>
          {object && <primitive object={object} />}
          <OrbitControls ref={controls} makeDefault enablePan enableZoom enableRotate autoRotate={rotate} autoRotateSpeed={1.5} minDistance={1.8} maxDistance={15} />
        </Canvas>
      </>}
    </div>
  </div>;
}