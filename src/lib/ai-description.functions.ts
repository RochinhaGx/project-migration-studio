import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const input = z.object({
  nome: z.string().trim().min(1).max(150),
  categoria: z.string().trim().min(1).max(80),
  materiais: z.array(z.string().max(10)).max(2),
  cores: z.array(z.string().max(40)).max(20),
  especificacoes: z.record(z.string().max(60), z.string().max(200)),
});

export const generateDescription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!role) throw new Error('Acesso não autorizado');
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error('Geração de descrição indisponível no momento.');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { streamText } = await import('ai');
    let runId: string | undefined;
    const provider = createOpenAI({
      baseURL: 'https://ai.gateway.lovable.dev/v1',
      apiKey: key,
      headers: { 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
      fetch: async (url, init) => {
        const headers = new Headers(init?.headers);
        if (runId) headers.set('X-Lovable-AIG-Run-ID', runId);
        const res = await fetch(url, { ...init, headers });
        runId ??= res.headers.get('X-Lovable-AIG-Run-ID') ?? undefined;
        if (res.status === 402) throw new Error('Os créditos de IA acabaram. Adicione créditos para continuar gerando descrições.');
        if (res.status === 429) throw new Error('Muitas solicitações agora. Tente novamente em instantes.');
        if (res.status === 403) throw new Error('A geração por IA está bloqueada para este espaço de trabalho.');
        return res;
      },
    });
    const specs = Object.entries(data.especificacoes).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (não informadas)';
    const prompt = `Produto: ${data.nome}\nCategoria: ${data.categoria}\nMateriais disponíveis: ${data.materiais.join(', ') || 'PLA'}\nCores disponíveis: ${data.cores.join(', ') || 'não informadas'}\nEspecificações:\n${specs}`;
    const result = streamText({
      model: provider.responses('openai/gpt-6-astra'),
      system:
        'Você é redator de uma loja premium de peças impressas em 3D chamada 3D Tech Studio. Escreva em português do Brasil uma descrição de venda para a página do produto: 2 parágrafos curtos (no máximo 90 palavras no total), tom elegante, direto e minimalista, destacando uso, acabamento e benefícios. Use apenas os dados fornecidos; não invente medidas, prazos ou garantias. Sem títulos, listas, emojis ou markdown.',
      prompt,
      providerOptions: {
        openai: { forceReasoning: true, reasoningEffort: 'low', reasoningSummary: 'auto', store: false, include: ['reasoning.encrypted_content'] },
      },
    });
    const text = (await result.text).trim();
    if (!text) throw new Error('Não foi possível gerar a descrição. Tente novamente.');
    return { text: text.slice(0, 5000) };
  });
