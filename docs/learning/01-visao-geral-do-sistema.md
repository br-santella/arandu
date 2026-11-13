# 1 — Visão geral do sistema

Este documento mostra as peças do Arandu e como elas se encaixam. Os detalhes de cada peça estão nos documentos seguintes.

## 1.1 O problema técnico em uma frase

O Arandu precisa **mostrar no celular, no lugar certo, informação histórica que foi verificada por pessoas**, e usar inteligência artificial para ajudar a encontrar essa informação **sem nunca publicar nada sozinha**.

Isso gera três necessidades:

1. um **aplicativo** que o estudante usa;
2. um **lugar central** onde a informação fica guardada e protegida;
3. **ferramentas de IA** que leem documentos e respondem perguntas, sempre sob controle humano.

## 1.2 Cliente e servidor

Quase todo sistema na internet tem duas metades:

- **Cliente:** o programa que a pessoa usa, no aparelho dela. No Arandu, é o **app**.
- **Servidor:** um computador em outro lugar, sempre ligado, que guarda dados e responde aos pedidos dos clientes. No Arandu, é o **Supabase**.

O cliente pede, o servidor responde. Por exemplo: o app pergunta "quais pontos existem perto daqui?" e o servidor devolve a lista.

Uma regra importante de segurança vem daí: **o cliente não é confiável**. Qualquer pessoa pode modificar o app no próprio celular. Por isso, todas as proteções importantes ficam no servidor (ver [documento 4](04-seguranca-e-privacidade.md)).

Também se fala em **frontend** (a parte visível, o app) e **backend** (a parte que roda no servidor).

## 1.3 As peças do Arandu

```text
┌─────────────────────────────┐
│  CELULAR OU NAVEGADOR       │
│  App Arandu (Expo)          │  ← o estudante usa
│  • mapa, cartões, desafios  │
│  • localização fica AQUI    │
└──────────────┬──────────────┘
               │ internet
               ▼
┌─────────────────────────────┐        ┌──────────────────────────┐
│  SUPABASE (servidor)        │◀──────▶│  Painel de curadoria     │
│  • banco de dados Postgres  │        │  (site para a equipe)    │
│  • login (Auth)             │        └──────────────────────────┘
│  • arquivos (Storage)       │
│  • funções (Edge Functions) │
└──────────────▲──────────────┘
               │ só propostas, nunca publica
┌──────────────┴──────────────┐
│  COMPUTADOR DA EQUIPE       │
│  Pipeline "revelar" (Python)│  ← lê documentos históricos
│  Ollama (modelos de IA)     │
└─────────────────────────────┘
```

| Peça | O que faz | Onde roda | Tecnologia | Estado |
| --- | --- | --- | --- | --- |
| **App** | Mapa, descobertas, cartões, desafios, guia | Celular (Android) e navegador | Expo, React Native, TypeScript | 🟡 Base pronta, telas planejadas |
| **Banco de dados** | Guarda pontos, fontes, validações, descobertas | Supabase | PostgreSQL + PostGIS + pgvector | 🟢 Pronto (sem conteúdo ainda) |
| **Login** | Identifica usuários sem pedir dados pessoais | Supabase | Supabase Auth (login anônimo) | 🟢 Pronto |
| **Guia** | Responde perguntas com base nas fontes | Supabase (Edge Function) | TypeScript + modelo de IA | ⚪ Planejado (M6) |
| **Painel de curadoria** | A equipe revisa, valida e publica | Navegador | Web | ⚪ Planejado (M5) |
| **Pipeline "revelar"** | Lê documentos e propõe pontos | Computador da equipe | Python | 🟡 Cliente de IA pronto, etapas planejadas (M4) |
| **Modelos de IA** | Entendem e geram texto; comparam significados | Computador da equipe | Ollama, `qwen3.5:9b`, `qwen3-embedding:0.6b` | 🟢 Instalados e testados |

## 1.4 O caminho da informação

O conteúdo do Arandu passa sempre pelo mesmo caminho, com pessoas no meio:

```text
documento histórico ──▶ IA propõe ──▶ curadoria revisa ──▶ pesquisa confere ──▶ comunidade valida ──▶ publicado no app
                                │               │                  │                   │
                                └───────────────┴──────────────────┴───────▶ rejeitado ou restrito
```

Só o que chega a **publicado** aparece no app. Essa regra não depende de o app "se comportar": está gravada no banco de dados (ver [documento 3](03-banco-de-dados-e-supabase.md) e [documento 4](04-seguranca-e-privacidade.md)).

## 1.5 Onde cada coisa está no repositório

Um **repositório** é a pasta do projeto, com todo o código e a documentação, cujo histórico é controlado pelo Git (ver [documento 7](07-workflow-de-desenvolvimento.md)).

```text
Arandu/
├── CLAUDE.md               regras do projeto (para pessoas e para o Claude Code)
├── README.md               apresentação
├── LICENSE                 licença MIT do código
├── .env.example            modelo das configurações (sem segredos)
├── docs/                   documentação
│   ├── arquitetura/        referência técnica com diagramas
│   └── learning/           esta trilha de estudo
├── apps/
│   └── mobile/             o app (Expo)
├── supabase/
│   ├── migrations/         a estrutura do banco, em arquivos SQL
│   ├── tests/              testes das regras de segurança do banco
│   ├── seed/               o conteúdo inicial (vem da pesquisa do M1)
│   └── config.toml         configuração do Supabase local
├── pipeline/               o pipeline de IA (Python)
└── .github/workflows/      verificações automáticas no GitHub (CI)
```

## 1.6 Três ambientes

O mesmo sistema existe em lugares diferentes, para propósitos diferentes:

| Ambiente | O que é | Para quê |
| --- | --- | --- |
| **Local** | Tudo rodando no notebook: Supabase dentro do Docker, Ollama, app no navegador | Desenvolver e testar sem afetar ninguém |
| **CI** (GitHub Actions) | Um computador temporário do GitHub que roda os testes a cada envio de código | Garantir que nada quebrou |
| **Remoto** (produção) | O projeto Supabase na nuvem, que o app publicado vai usar | O que usuários e banca vão ver |

Mudanças sempre passam primeiro pelo local, depois pelo CI e só então chegam ao remoto.

## 1.7 Estado atual (fim do M0)

- ✅ O banco existe, local e remoto, com todas as regras de segurança testadas.
- ✅ O login anônimo funciona no remoto.
- ✅ Os modelos de IA estão instalados e responderam corretamente num teste real.
- ✅ O app abre na tela de boas-vindas; as outras telas são rotas vazias.
- ❌ As peças **ainda não conversam entre si**: o app não lê o banco, o pipeline não grava propostas, o guia não existe.
- ❌ Ainda não há conteúdo real. Ele vem da pesquisa do M1.

Os próximos passos estão em `docs/08-backlog.md`.
