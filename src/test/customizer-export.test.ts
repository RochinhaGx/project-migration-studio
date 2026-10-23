import { describe, expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh } from 'three';
import { exportModelSTL } from '@/lib/customizer-export';

describe('Personalized STL', () => {
  it('exports a centimetre model in millimetres without changing the preview', async () => {
    const group = new Group();
    group.add(new Mesh(new BoxGeometry(2, 1, 0.3)));
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { if (reader.result instanceof ArrayBuffer) resolve(reader.result); else reject(new Error('Invalid STL')); };
      reader.onerror = reject;
      reader.readAsArrayBuffer(exportModelSTL(group));
    });
    const view = new DataView(buffer);
    expect(view.getUint32(80, true)).toBe(12);
    const xs: number[] = [];
    for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) xs.push(view.getFloat32(84 + i * 50 + 12 + j * 12, true));
    expect(Math.max(...xs) - Math.min(...xs)).toBe(20);
    expect(group.scale.x).toBe(1);
  });
});