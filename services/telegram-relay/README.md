# Telegram relay

Função Vercel que recebe mensagens do chat de `cabraiz.com` e as entrega ao
Telegram sem expor o token do bot no navegador.

## Variáveis secretas

- `TELEGRAM_BOT_TOKEN`: token novo gerado no BotFather.
- `TELEGRAM_CHAT_ID`: ID da conversa que receberá as mensagens.
- `ALLOWED_ORIGINS`: opcional; lista separada por vírgulas. O padrão aceita
  `https://cabraiz.com`, `https://www.cabraiz.com` e os endereços locais usados
  no desenvolvimento.

O token informado em chat ou versionado deve ser revogado antes do deploy.

## Deploy

Defina `services/telegram-relay` como Root Directory do projeto Vercel. Depois
de cadastrar os segredos, publique a função e configure a variável pública
`VITE_CONTACT_API_URL` do build do site com a URL final `/api/contact`.
