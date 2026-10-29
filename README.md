# Ponte Zero

**Conectando estudantes a oportunidades, antes que seja tarde.**

Software de análise de dados e encaminhamento para prevenir a evasão escolar. A equipe pedagógica vê quem precisa de atenção, registra a conversa com o estudante e encaminha para apoios compatíveis com a rotina dele. O estudante acompanha os próprios apoios e inscrições pelo app.

> A tecnologia apoia, as pessoas decidem. Sem rótulos, com olhar humano.

## Telas

| Rota | Tela | Para quem |
| --- | --- | --- |
| `/` | Apresentação do projeto | Todos |
| `/painel` | Painel da equipe: sinais da semana, acompanhamentos em dia, sinais recentes e pedidos de ajuda | Equipe |
| `/casos` | Fluxo de atendimento: casos por etapa | Equipe |
| `/caso/:id` | Detalhe do caso: conversa, apoios sugeridos, encaminhamento com responsável e data de retorno | Equipe |
| `/apoios` | Apoios para você: busca, filtro por necessidade e prazo em destaque | Estudante e equipe |
| `/meu-caminho` | Meu caminho: progresso, próximas ações, inscrições, pedir ajuda e conquistas | Estudante |

## Stack

- React 19 + TypeScript + Vite, TanStack Router e TanStack Query
- Tailwind CSS 4 com a paleta da apresentação (azul das nuvens, azul profundo, vermelho da ponte, céu quente, fundo creme)
- API serverless em `api/index.ts` (Vercel Functions) sobre **Postgres no Neon** (`@neondatabase/serverless`)
- PWA instalável e com funcionamento offline básico (`vite-plugin-pwa`)

## Rodando localmente

```sh
npm install
cp .env.example .env   # coloque a sua DATABASE_URL do Neon
npm run db:setup       # cria as tabelas e insere dados de exemplo (só se estiverem vazias)
npm run dev            # http://localhost:5173 — a API /api roda junto no Vite
```

## Deploy na Vercel

1. Importe o repositório na Vercel (o `vercel.json` já define build, saída `dist` e rotas).
2. Em **Settings → Environment Variables**, crie `DATABASE_URL` com a connection string do Neon.
3. Faça o deploy. As rotas `/api/*` vão para a função `api/index.ts`; as demais caem no app (SPA).

## Banco de dados

Tabelas criadas por `scripts/db-setup.mjs`: `students`, `notes`, `supports`, `referrals` e `help_requests`.

## Acadêmicos

Valdemar Tieppo Neto • Lucas Kenzo Carvalho Yamamoto • Eric Barros Arco-verde • Jean Carlos Sousa Novaes

_Protótipo conceitual: casos e dados exibidos são exemplos ilustrativos._
