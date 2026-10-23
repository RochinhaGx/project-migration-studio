import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Ban, Check, Copy, Loader2, QrCode, RefreshCw, TimerOff, WifiOff, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/components/store/store-provider';
import { createPixPayment, getPixStatus } from '@/lib/pix.functions';
import { maskCpf, payerSchema, type Freight, type Payer, type PixFailure } from '@/lib/payment-rules';
import { money } from '@/lib/store-schema';
import { toast } from '@/lib/notify';

type Pix = Awaited<ReturnType<typeof createPixPayment>>;
type GenError = { kind: 'conexao' | 'erro'; message: string };

const FAILURES: Record<PixFailure, { icon: LucideIcon; title: string; text: string }> = {
  expirado: { icon: TimerOff, title: 'Pix expirado', text: 'O prazo para pagar este QR Code acabou e nada foi cobrado. Gere um novo código para concluir sua compra.' },
  recusado: { icon: Ban, title: 'Pagamento recusado', text: 'O pagamento não foi aprovado pelo banco ou pelo Mercado Pago e nada foi cobrado. Confira os dados e gere um novo QR Code, ou pague com cartão.' },
};

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync); window.addEventListener('offline', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); };
  }, []);
  return online;
}

function Notice({ tone, icon: Icon, title, children }: { tone: 'error' | 'warning'; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className={`pix-notice pix-notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="pix-notice-icon" aria-hidden="true"><Icon size={20} /></span>
      <div><strong>{title}</strong><p>{children}</p></div>
    </div>
  );
}

function timeLeft(ms: number) {
  if (ms > 3600_000) return null;
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function PixCheckout({ open, onOpenChange, cep, ship, total }: { open: boolean; onOpenChange: (v: boolean) => void; cep: string; ship: Freight | undefined; total: number }) {
  const { bag, user, clear } = useStore();
  const navigate = useNavigate();
  const online = useOnline();
  const [form, setForm] = useState({ nome: '', email: '', cpf: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [pix, setPix] = useState<Pix | null>(null);
  const [genError, setGenError] = useState<GenError | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const payer = useRef<Payer | null>(null);

  useEffect(() => { if (user?.email) setForm((f) => (f.email ? f : { ...f, email: user.email ?? '' })); }, [user]);

  useEffect(() => {
    if (!pix?.expiresAt) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pix?.expiresAt]);

  const msLeft = pix?.expiresAt ? new Date(pix.expiresAt).getTime() - now : null;
  const expiredLocally = msLeft !== null && msLeft <= 0;

  const status = useQuery({
    queryKey: ['pix-status', pix?.orderId],
    enabled: !!pix,
    retry: 1,
    queryFn: () => getPixStatus({ data: { orderId: pix!.orderId } }),
    refetchInterval: (q) => (q.state.data?.paid || q.state.data?.motivo ? false : 4000),
  });

  const failure: PixFailure | null = status.data?.motivo ?? (expiredLocally ? 'expirado' : null);
  const connectionLost = !failure && (!online || status.isError || !!status.data?.checkFailed);

  useEffect(() => {
    if (status.data?.paid && pix) {
      clear();
      onOpenChange(false);
      void navigate({ to: '/pedido-confirmado', search: { pedido: pix.orderId } });
    }
  }, [status.data?.paid]);

  const generate = async (p: Payer) => {
    if (!ship) { toast.error('Escolha a entrega', { description: 'Calcule o frete pelo CEP antes de pagar.' }); return; }
    setBusy(true); setGenError(null);
    try {
      const r = await createPixPayment({ data: { payer: p, cep, service: ship.service, items: bag.map((x) => ({ id: x.product.id, quantity: x.quantity, color: x.color, material: x.material as 'PLA' | 'PETG' })) } });
      setCopied(false);
      setPix(r);
    } catch (err) {
      const offline = !navigator.onLine || err instanceof TypeError;
      setGenError(offline
        ? { kind: 'conexao', message: 'Não conseguimos falar com o servidor de pagamento. Verifique sua internet e tente de novo.' }
        : { kind: 'erro', message: err instanceof Error ? err.message : 'Não foi possível gerar o Pix. Tente novamente.' });
    } finally { setBusy(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = payerSchema.safeParse(form);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof typeof form] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    payer.current = parsed.data;
    await generate(parsed.data);
  };

  const regenerate = async () => {
    if (!payer.current) { setPix(null); return; }
    await generate(payer.current);
  };

  const copy = async () => {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.qrCode); setCopied(true); toast.success('Código Pix copiado', { description: 'Cole no app do seu banco para pagar.' }); setTimeout(() => setCopied(false), 2500); }
    catch { toast.error('Não foi possível copiar', { description: 'Selecione o código e copie manualmente.' }); }
  };

  const field = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="pix-field">
      <span>{label}</span>
      <input {...props} value={form[key]} aria-invalid={!!errors[key]} onChange={(e) => setForm({ ...form, [key]: key === 'cpf' ? maskCpf(e.target.value) : e.target.value })} />
      {errors[key] && <small role="alert">{errors[key]}</small>}
    </label>
  );

  const regenButton = (label = 'Gerar novo QR Code') => (
    <Button className="w-full h-12" onClick={regenerate} disabled={busy}>{busy ? <><Loader2 className="animate-spin" /> Gerando novo Pix…</> : <><RefreshCw /> {label}</>}</Button>
  );

  const left = msLeft !== null && !failure ? timeLeft(msLeft) : null;
  const description = !pix ? 'Preencha os dados do pagador para gerar o código Pix.'
    : failure ? 'Este código não pode mais ser pago. Você pode gerar outro em um clique.'
    : 'Escaneie o QR Code ou use o Pix Copia e Cola no app do seu banco.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pix-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><QrCode size={20} /> Pagar com Pix</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!pix ? (
          <form className="pix-form" onSubmit={submit} noValidate>
            {field('nome', 'Nome completo', { autoComplete: 'name', maxLength: 120, placeholder: 'Maria da Silva' })}
            {field('email', 'E-mail', { type: 'email', autoComplete: 'email', maxLength: 255, placeholder: 'voce@email.com' })}
            {field('cpf', 'CPF', { inputMode: 'numeric', maxLength: 14, placeholder: '000.000.000-00' })}
            <div className="pix-total">
              <span>Total com entrega {ship ? `(${ship.service})` : ''}</span>
              <strong>{money(total)}</strong>
            </div>
            {genError && (
              <Notice tone="error" icon={genError.kind === 'conexao' ? WifiOff : AlertTriangle} title={genError.kind === 'conexao' ? 'Falha de conexão' : 'Não foi possível gerar o Pix'}>{genError.message}</Notice>
            )}
            <Button type="submit" className="w-full h-12" disabled={busy}>{busy ? <><Loader2 className="animate-spin" /> Gerando Pix…</> : genError ? <><RefreshCw /> Tentar novamente</> : 'Gerar QR Code Pix'}</Button>
          </form>
        ) : failure ? (
          <div className="pix-result">
            <Notice tone="error" icon={FAILURES[failure].icon} title={FAILURES[failure].title}>{FAILURES[failure].text}</Notice>
            <div className="pix-total"><span>Pedido #{pix.codigo}</span><strong>{money(pix.total)}</strong></div>
            {genError && <Notice tone="error" icon={genError.kind === 'conexao' ? WifiOff : AlertTriangle} title={genError.kind === 'conexao' ? 'Falha de conexão' : 'Não foi possível gerar o Pix'}>{genError.message}</Notice>}
            {regenButton(genError ? 'Tentar gerar novamente' : undefined)}
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>Escolher outra forma de pagamento</Button>
          </div>
        ) : (
          <div className="pix-result">
            {connectionLost && (
              <Notice tone="warning" icon={WifiOff} title="Falha de conexão">
                {!online ? 'Você está sem internet.' : 'Não conseguimos verificar o pagamento agora.'} Se já pagou, fique tranquilo: a confirmação aparece assim que a conexão voltar.
              </Notice>
            )}
            <img className="pix-qr" src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code Pix para pagamento" />
            <div className="pix-total"><span>Pedido #{pix.codigo}</span><strong>{money(pix.total)}</strong></div>
            <label className="pix-field"><span>Pix Copia e Cola</span><textarea readOnly rows={3} value={pix.qrCode} onFocus={(e) => e.currentTarget.select()} /></label>
            <Button className="w-full h-12" onClick={copy}>{copied ? <><Check /> Copiado!</> : <><Copy /> Copiar código Pix</>}</Button>
            {connectionLost ? (
              <Button variant="outline" className="w-full" onClick={() => void status.refetch()} disabled={status.isFetching}>{status.isFetching ? <><Loader2 className="animate-spin" /> Verificando…</> : <><RefreshCw /> Verificar pagamento novamente</>}</Button>
            ) : (
              <p className="pix-waiting" role="status"><Loader2 className="animate-spin" size={16} /> Aguardando pagamento — esta tela atualiza sozinha.{left && <> Expira em <strong>{left}</strong>.</>}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
