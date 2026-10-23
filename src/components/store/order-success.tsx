import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

export function OrderSuccess({ description = 'Sua peça entrou na fila de impressão.', children }: { description?: string; children?: ReactNode }) {
  return <div className="order-success" role="status">
    <div className="success-art" aria-hidden="true">
      <span className="success-ring" />
      <div className="success-check"><Check strokeWidth={3} /></div>
      {Array.from({ length: 14 }, (_, i) => <i key={i} className={`confetti confetti-${i}`} />)}
    </div>
    <h1>Pedido feito!</h1><p>{description}</p>
    <div className="success-actions">{children}</div>
  </div>;
}