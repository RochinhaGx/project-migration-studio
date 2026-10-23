import { useEffect, useState } from 'react';
import { Cookie, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const KEY = '3dtech-cookie-preferences';
export function CookieCard() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  useEffect(() => { try { setVisible(!localStorage.getItem(KEY)); } catch { setVisible(true); } }, []);
  function save(value: boolean) {
    try { localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: value, savedAt: new Date().toISOString() })); } catch { /* Keep the page usable when storage is unavailable. */ }
    setVisible(false); setOpen(false);
  }
  return <>
    {visible && <aside className="cookie-card" aria-label="Aviso de cookies"><div className="cookie-title"><Cookie size={20} /><strong>Um toque de cookies</strong></div><p>Usamos cookies essenciais para o site funcionar. Você decide sobre os opcionais.</p><div className="cookie-actions"><Button variant="link" onClick={() => setOpen(true)}>Gerenciar preferências</Button><Button onClick={() => save(true)}>Aceitar</Button></div></aside>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="cookie-dialog"><DialogHeader><DialogTitle>Preferências de cookies</DialogTitle><DialogDescription>Escolha quais cookies você permite neste site.</DialogDescription></DialogHeader><div className="cookie-preference"><span><strong><ShieldCheck size={16}/>Essenciais</strong><small>Necessários para navegação e segurança.</small></span><Switch checked disabled aria-label="Cookies essenciais" /></div><div className="cookie-preference"><span><strong>Estatísticas</strong><small>Permitir estatísticas opcionais quando disponíveis.</small></span><Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Cookies de estatísticas" /></div><div className="cookie-dialog-actions"><Button variant="outline" onClick={() => save(false)}>Só essenciais</Button><Button onClick={() => save(analytics)}>Salvar preferências</Button></div></DialogContent></Dialog>
  </>;
}