# Migração para Hostinger + seu projeto 3dTechStudio

O código já está pronto: ele usa o banco que estiver nas variáveis de ambiente da Hostinger. Nada no código precisa mudar.

## 1. Estrutura do banco (no seu projeto 3dTechStudio)
1. Abra o projeto → **SQL Editor** → cole todo o `01-estrutura.sql` → **Run**.
   Cria tabelas, permissões, regras de acesso e as pastas de arquivos (até 500 MB).

## 2. Dados (produtos, categorias, pedidos)
1. No Lovable: **Cloud → Database → Tables**, abra cada tabela e use **Export CSV**:
   `produtos`, `categorias`, `pedidos`, `pedidos_sob_medida`.
2. No 3dTechStudio: **Table Editor** → abra a tabela com o mesmo nome → **Insert → Import data from CSV**.
   Importe `categorias` e `produtos` primeiro.
3. Contas de clientes não são copiadas por CSV: cada cliente entra de novo (Google ou cria senha).

## 3. Fotos, vídeos e modelos 3D dos produtos
No Lovable: **Cloud → Storage → product-media** → baixe os arquivos.
No 3dTechStudio: **Storage → product-media** → envie os mesmos arquivos **com os mesmos nomes**.
(As 9 fotos da loja — logo, capa, Personalizar — já vão junto com o código.)

## 4. Variáveis na Hostinger (Configurações → Variáveis de ambiente)
Pegue os valores em **Project Settings → API** do 3dTechStudio.

| Nome | Valor |
|---|---|
| VITE_SUPABASE_URL | Project URL |
| SUPABASE_URL | Project URL |
| VITE_SUPABASE_PUBLISHABLE_KEY | chave publishable (sb_publishable_...) |
| SUPABASE_PUBLISHABLE_KEY | mesma chave publishable |
| SUPABASE_SERVICE_ROLE_KEY | chave **secret** (sb_secret_...) — nunca mande em chat |
| STRIPE_RESTRICTED_API_KEY | Stripe → Developers → API keys |
| STRIPE_WEBHOOK_SECRET | passo 7 |
| MERCADOPAGO_ACCESS_TOKEN | **novo** Access Token (gere outro; o antigo foi exposto no chat) |
| MERCADOPAGO_WEBHOOK_SECRET | passo 8 (opcional) |
| NODE_ENV | production |
| NITRO_HOST | 0.0.0.0 |

Depois de salvar, faça **reimplantar** o site.

## 5. Google login
1. Google Cloud Console → **APIs e serviços → Credenciais → Criar ID do cliente OAuth** (Aplicativo da Web).
2. Em "URIs de redirecionamento autorizados" cole o endereço mostrado no 3dTechStudio em
   **Authentication → Sign In / Providers → Google** (Callback URL).
3. Copie Client ID e Client Secret para essa mesma tela do 3dTechStudio e ative o Google.
4. 3dTechStudio → **Authentication → URL Configuration**:
   - Site URL: `https://3dtechstudio.com.br`
   - Redirect URLs: `https://3dtechstudio.com.br/**`

## 6. Administrador
Entre uma vez na loja nova com gui23rocha@gmail.com, depois rode `02-tornar-admin.sql` no SQL Editor. Saia e entre de novo.

## 7. Cartão (Stripe)
Stripe → Developers → **Webhooks → Add endpoint**
- URL: `https://3dtechstudio.com.br/api/public/stripe-webhook`
- Evento: `checkout.session.completed`
- Copie o "Signing secret" (whsec_...) para `STRIPE_WEBHOOK_SECRET` na Hostinger.

## 8. Pix (Mercado Pago)
Mercado Pago → Suas integrações → sua aplicação → **Webhooks**
- URL: `https://3dtechstudio.com.br/api/public/mercadopago/webhook`
- Evento: **Pagamentos**
- Copie a "assinatura secreta" para `MERCADOPAGO_WEBHOOK_SECRET`.
Gere um novo Access Token (credenciais de produção) e troque na Hostinger.

## 9. Teste final
1. Abrir a loja: fotos e produtos aparecem.
2. Entrar com Google.
3. Comprar algo barato com Pix: o QR code aparece e, depois de pago, o pedido muda para pago.
4. Comprar com cartão.
5. Painel admin abre.

Só desligue o Lovable Cloud depois que tudo isso funcionar.
