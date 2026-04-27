# PokéDecks AI — Deploy no Netlify

## Estrutura de arquivos

```
/
├── index.html                        ← app principal
├── netlify.toml                      ← configuração do Netlify
└── netlify/
    └── functions/
        ├── gemini.js                 ← proxy seguro para Gemini (análise de deck)
        └── limitless.js             ← proxy para Limitless TCG (meta automático)
```

## Passo a passo

### 1. Suba os arquivos no GitHub
Crie um repositório e faça push de todos os arquivos mantendo a estrutura acima.

### 2. Conecte ao Netlify
- Acesse app.netlify.com
- Clique em "Add new site → Import an existing project"
- Selecione seu repositório do GitHub
- Clique em "Deploy site" (o netlify.toml já cuida de tudo)

### 3. Configure a variável de ambiente (OBRIGATÓRIO)
- No painel do Netlify: Site configuration → Environment variables
- Adicione: Key = GEMINI_API_KEY / Value = sua chave do Google AI Studio
- Salve e faça redeploy (Deploys → Trigger deploy)

### Como obter a chave do Gemini (gratuita)
- Acesse: aistudio.google.com/apikey
- Clique em "Create API key"
- Cole na variável de ambiente acima

## O que funciona após o deploy
- Análise de decks via Gemini 2.0 Flash (gratuito)
- Aba Meta atualizada automaticamente com dados reais do Limitless TCG
- Busca de cartas via Pokémon TCG API (pública, sem chave)

## APIs
- Google Gemini 2.0 Flash → análise/geração de decks → gratuito
- Pokémon TCG API → busca de cartas → gratuito
- Limitless TCG → meta em tempo real → gratuito
