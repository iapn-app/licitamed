# ANVISA Proxy — Cloudflare Worker

Proxy que contorna o bloqueio de IPs da Vercel/AWS na API da ANVISA.
Cloudflare Workers usam IPs residenciais/CDN que não são bloqueados.

## Deploy (plano gratuito — 100k req/dia)

1. Crie conta gratuita em [cloudflare.com](https://cloudflare.com)
2. Acesse **Workers & Pages → Create Worker**
3. Clique em **Edit Code** e substitua todo o conteúdo pelo código de `anvisa-proxy.js`
4. Clique em **Deploy**
5. Copie a URL gerada (ex: `https://anvisa-proxy.seu-usuario.workers.dev`)

## Configurar na Vercel

Adicione a variável de ambiente no projeto licitamed:

```
ANVISA_PROXY_URL=https://anvisa-proxy.seu-usuario.workers.dev
```

Via CLI:
```bash
npx vercel env add ANVISA_PROXY_URL production
# cole a URL do worker quando solicitado
```

Após adicionar a variável, faça redeploy:
```bash
npx vercel --prod --force
```

## Como funciona

O Worker recebe `?q={termo}&tipo={produto|medicamento}` e faz a requisição
para `consultas.anvisa.gov.br` usando os headers de browser corretos.
O resultado é cacheado por 1 hora no edge da Cloudflare.

A rota `/api/anvisa/buscar` tenta o proxy primeiro. Se não estiver configurado
(`ANVISA_PROXY_URL` ausente) ou falhar, cai nas fontes alternativas.
