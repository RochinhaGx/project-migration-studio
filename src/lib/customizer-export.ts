import { Group } from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

/** Export exactly the displayed meshes, converting centimetres to millimetres. */
export function exportModelSTL(model: Group): Blob {
  const copy = model.clone(true);
  copy.position.set(0, 0, 0);
  copy.scale.multiplyScalar(10);
  copy.updateMatrixWorld(true);
  const output = new STLExporter().parse(copy, { binary: true });
  return new Blob([new Uint8Array(output.buffer as ArrayBuffer)], { type: 'application/octet-stream' });
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function capturePreview(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob); else reject(new Error('Não foi possível criar a foto da peça.'));
  }, 'image/png'));
}