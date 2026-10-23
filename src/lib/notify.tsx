import { toast as sonner } from 'sonner';
import { Check, Info, X } from 'lucide-react';

type Tone = 'success' | 'error' | 'info';
type Options = { description?: string; image?: string | undefined; actionLabel?: string; onAction?: () => void; duration?: number };

const icons = { success: Check, error: X, info: Info } as const;

function Card({ id, tone, title, o }: { id: string | number; tone: Tone; title: string; o: Options }) {
  const Icon = icons[tone];
  const ms = o.duration ?? 4200;
  return (
    <div className={`toast3d toast3d-${tone}`} role={tone === 'error' ? 'alert' : 'status'} style={{ ['--toast-ms' as string]: `${ms}ms` }}>
      <div className="toast3d-cube" aria-hidden="true">
        {o.image ? <img src={o.image} alt="" /> : <Icon size={20} strokeWidth={2.75} />}
        {o.image && <span className="toast3d-badge"><Icon size={11} strokeWidth={3.5} /></span>}
      </div>
      <div className="toast3d-text">
        <strong>{title}</strong>
        {o.description && <span>{o.description}</span>}
      </div>
      {o.actionLabel && o.onAction && (
        <button type="button" className="toast3d-action" onClick={() => { o.onAction?.(); sonner.dismiss(id); }}>{o.actionLabel}</button>
      )}
      <button type="button" className="toast3d-close" aria-label="Fechar notificação" onClick={() => sonner.dismiss(id)}><X size={14} /></button>
      <i className="toast3d-timer" aria-hidden="true" />
    </div>
  );
}

function show(tone: Tone, title: string, o: Options = {}) {
  return sonner.custom((id) => <Card id={id} tone={tone} title={title} o={o} />, { duration: o.duration ?? 4200 });
}

export const toast = {
  success: (title: string, o?: Options) => show('success', title, o),
  error: (title: string, o?: Options) => show('error', title, o),
  info: (title: string, o?: Options) => show('info', title, o),
};
