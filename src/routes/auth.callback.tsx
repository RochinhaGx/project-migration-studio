import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/store-schema';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/auth/callback')({ head: () => pageHead('Confirmar acesso', 'Confirmação segura do acesso à sua conta na 3D Tech Studio.'), component: AuthCallback });
function AuthCallback() {
  const navigate = useNavigate();
  const pending = useRef<Promise<void> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!pending.current) pending.current = (async () => {
      const query = new URLSearchParams(window.location.search);
      if (query.has('error')) throw new Error('O Google não autorizou o acesso. Tente entrar novamente.');
      // The generated client exchanges OAuth callback codes automatically.
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) throw new Error('Não foi possível confirmar seu acesso. Confira a configuração do Google e tente novamente.');
      window.history.replaceState(null, '', '/auth/callback');
      await navigate({ to: '/auth', replace: true });
    })();
    void pending.current.catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível entrar.'));
  }, [navigate]);
  return <section className="page-width form-page"><h1 className="page-title">{error ? 'Acesso não confirmado' : 'Confirmando acesso…'}</h1>{error && <><p role="alert" className="error-text">{error}</p><Button onClick={() => void navigate({ to: '/auth' })}>Voltar para entrar</Button></>}</section>;
}