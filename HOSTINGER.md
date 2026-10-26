# Publicar a 3D Tech Studio na Hostinger

## Campos exatos

| Campo da Hostinger | Valor |
| --- | --- |
| Configuração predefinida | `Nitro` |
| Branch | `main` |
| Versão do Node | `22.x` (22.12 ou mais recente dentro da série 22) |
| Diretório raiz | `./` — raiz do repositório, onde está `package.json`; nunca `public` nem `src` |
| Comando de construção | `npm run build:hostinger` |
| Gerenciador de pacotes | `npm` |
| Diretório de saída | `.output` |
| Arquivo de entrada | `server/index.mjs` — relativo ao diretório de saída |

Se a Hostinger oferecer um campo separado para comando de inicialização na raiz do projeto, use `npm start`. Não use `vite preview` em produção.

O código configura Nitro com `node-server` fora do Lovable. A publicação gerenciada pelo Lovable continua usando o destino da plataforma. O comando para Hostinger confere as oito fotos antes da compilação e verifica o servidor e as fotos em `.output` depois da compilação.

## Diretório raiz

Na tela “Selecionar diretório raiz”, volte para a raiz do repositório. Ela deve conter `package.json`, `vite.config.ts`, `src`, `public` e `scripts`. Se o seletor não permitir selecionar a raiz, cancele e mantenha o valor padrão `./` em vez de escolher uma subpasta.

## Imagens

As oito fotos efetivamente usadas pela loja agora estão em `public/__l5e/assets-v1/`, nos mesmos caminhos dos ponteiros. Não é necessário enviar o ZIP de fotos novamente se a Hostinger importar esta versão atualizada do repositório. Não exclua essa pasta antes de publicar.

Inclui logo atual, foto principal, fundo sob medida, quatro fotos de Personalizar e alternativa para celular. O endereço para celular contém a foto principal existente porque o arquivo antigo exclusivo para celular não estava acessível. Nenhuma imagem foi recriada. As fotos dos produtos que ainda não foram enviadas pelo proprietário continuam faltando.

## Variáveis de ambiente

Insira em **Variáveis de ambiente → Editar**. O banco usado no navegador e no servidor deve ser o mesmo. Os valores privados são configurados apenas na Hostinger, nunca no repositório ou no chat.

| Nome exato | Valor a usar | Disponibilidade |
| --- | --- | --- |
| `NODE_ENV` | `production` | Produção |
| `NITRO_HOST` | `0.0.0.0` | Execução |
| `VITE_SUPABASE_URL` | Endereço público do banco de destino | Compilação |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do mesmo banco | Compilação |
| `SUPABASE_URL` | Mesmo endereço do banco de destino | Execução |
| `SUPABASE_PUBLISHABLE_KEY` | Mesma chave pública | Execução |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada de administração do banco externo de destino | Somente execução/servidor |
| `STRIPE_RESTRICTED_API_KEY` | Chave privada restrita da sua conta Stripe | Somente execução/servidor |
| `STRIPE_WEBHOOK_SECRET` | Segredo de assinatura do endpoint Stripe no domínio da Hostinger | Somente execução/servidor |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token da sua conta Mercado Pago | Somente execução/servidor |
| `MERCADOPAGO_WEBHOOK_SECRET` | Segredo de assinatura do Mercado Pago, se configurado | Somente execução/servidor; opcional |
| `LOVABLE_API_KEY` | Chave autorizada para a geração de descrições por IA | Somente execução/servidor; necessária apenas para esse recurso |

Não defina `PORT` ou `NITRO_PORT` manualmente: o servidor lê a porta fornecida pela Hostinger. Não copie variáveis internas do ambiente Lovable para a Hostinger. Nunca crie variáveis `VITE_*` para chaves privadas. Não envie o arquivo `.env` do Lovable como configuração da sua conta externa: os valores da Hostinger precisam apontar para o destino correto.

A chave privada de administração do Lovable Cloud não está disponível para exportação. Para usar sua própria conta, o banco de destino precisa conter o esquema e os dados da loja antes de apontar a aplicação para ele. Definir apenas URL e chave pública não transfere produtos, usuários, permissões ou arquivos.

## O que ainda depende dos serviços externos

- Importar tabelas, dados, permissões e arquivos privados no banco de destino. Não altere nem apague o banco atual antes de conferir a migração.
- Configurar os endereços de confirmação e recuperação de senha para o domínio da Hostinger no serviço de autenticação de destino.
- O botão Google ainda usa a integração de autenticação Lovable. Seu funcionamento no domínio externo não foi validado; mudar variáveis não configura automaticamente o Google no banco de destino. É preciso configurar e testar o fluxo externo antes de considerar esse recurso pronto.
- Configurar o endpoint Stripe no domínio real usando o caminho `/api/public/stripe-webhook`.
- Configurar o endpoint Mercado Pago usando o caminho `/api/public/mercadopago/webhook`.
- As chaves de pagamento armazenadas no Lovable não são transferidas automaticamente para a Hostinger.
- A geração de descrições continua usando o serviço de IA Lovable e depende de acesso autorizado.

## Conferência após publicar

1. Abra a página inicial e Personalizar; confira logo e fotos no computador e celular.
2. Atualize diretamente `/catalogo` e `/personalizar` para testar os endereços.
3. Confira os produtos do banco de destino, entre na conta correta e teste as permissões administrativas.
4. Teste recuperação de senha, Google, pedido sob medida e upload privado.
5. Faça um teste de pagamento em ambiente apropriado e confira se a confirmação chega à loja.

As fotos foram testadas em uma hospedagem estática independente do Lovable. A prévia e os testes automatizados não comprovam uma publicação Node na Hostinger; o comando de construção inclui verificações para essa publicação, e a versão final precisa ser conferida no domínio real.