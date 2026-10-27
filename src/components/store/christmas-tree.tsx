import { Center, Text3D } from '@react-three/drei';
import { useMemo } from 'react';
import { Shape } from 'three';
import { treeRows, treeNames } from '@/lib/christmas-tree';

function Row({ text, width, y, font, color, size, spacing }: { text: string; width: number; y: number; font: string; color: string; size: number; spacing: number }) {
  return <group position={[0, y, 0]}><Center onCentered={({ container, width: actual }) => { if (actual > 0) container.scale.x = width / actual; }}><Text3D font={font} size={size} height={0.4} letterSpacing={spacing} curveSegments={6} bevelEnabled bevelSize={0.015} bevelThickness={0.015}>{text}<meshStandardMaterial color={color} roughness={0.65}/></Text3D></Center></group>;
}
export function ChristmasTree({ text, year, size, font, spacing, primary, secondary, star }: { text: string; year: string; size: number; font: string; spacing: number; primary: string; secondary: string; star: string }) {
  const shape = useMemo(() => {
    const shape = new Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 0.32 : 0.72; const x = Math.cos(a) * r; const y = Math.sin(a) * r; if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y); }
    shape.closePath(); return shape;
  }, []);
  const rows = treeRows(text, year, size);
  return <group position={[0, -(treeNames(text).length * 1.05 * size) / 2, 0]}>
    {rows.map((r, i) => <Row key={`${i}-${r.text}`} {...r} size={size} spacing={spacing} font={font} color={r.alternate ? secondary : primary}/>)}
    <mesh position={[0, (treeNames(text).length * 1.05 + 1.1) * size, -0.2]} scale={size}><extrudeGeometry args={[shape, { depth: 0.4, bevelEnabled: false }]} /><meshStandardMaterial color={star} roughness={0.6}/></mesh>
  </group>;
}