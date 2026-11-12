# 04 — Arquitetura técnica

> Diagramas UML, fluxos detalhados, matriz de acesso e estado de cada componente: [`docs/arquitetura/`](arquitetura/README.md).

## Visão geral

```
                ┌───────────────────────────┐
 Documentos ──▶ │ pipeline/ (Python)        │
 históricos     │ OCR → extração → geocod.  │
                └─────────────┬─────────────┘
                              │ propostas
                              ▼
                ┌───────────────────────────┐        ┌──────────────────────┐
                │ Supabase                  │◀──────▶│ apps/admin (web)     │
                │ Postgres + PostGIS        │        │ curadoria/validação  │
                │ pgvector, Auth, Storage   │        └──────────────────────┘
                │ Edge Functions (guia RAG) │
                └─────────────┬─────────────┘
                              │ apenas conteúdo publicado
                              ▼
                ┌───────────────────────────┐
                │ apps/mobile (Expo)        │
                │ Android e web (iOS depois)│
                └───────────────────────────┘
```

## Stack (decidida em 2026-11-12, ver `docs/decisoes.md`)

| Camada | Escolha | Motivo |
| --- | --- | --- |
| App | **Expo (React Native) + TypeScript** | Um código para Android, iOS e web; a versão web facilita a demonstração por link. No protótipo: Android e web |
| Mapa | **MapLibre** (`@maplibre/maplibre-react-native` no mobile, `maplibre-gl` no web) | Open source, estilos customizáveis para o mapa escuro, sem custo por uso. Exige *development build* no mobile (não roda no Expo Go) |
| Tiles do mapa | Estilo configurável por `EXPO_PUBLIC_MAP_STYLE_URL` (ex.: OpenFreeMap, sem chave; ou PMTiles no Supabase Storage) | Gratuito; a troca de fornecedor não exige mudar código |
| Células do mapa | **H3** (`h3-js`) | Grade hexagonal para "acender" áreas de forma consistente |
| Estado e dados | TanStack Query + Zustand | Cache de servidor e estado local simples |
| Backend | **Supabase** (Postgres, PostGIS, pgvector, Auth, Storage, Edge Functions) | Rápido de montar, open source, consultas geográficas e vetoriais no mesmo banco |
| Painel de curadoria | **Next.js** ou Expo web em rota separada | Interface simples de formulários e tabelas |
| Pipeline de IA | **Python** (uv, pydantic, pytest) | Ecossistema de OCR, NLP e notebooks |
| OCR | **Tesseract** com modelo `por` | Gratuito e local |
| LLM | **Modelo aberto** (famílias Qwen, Gemma, Llama ou Mistral, 7–9B quantizado) via **Ollama**, acessado por uma API compatível com OpenAI (`LLM_BASE_URL`, `LLM_MODEL`) | Custo zero, roda em GPU de 8 GB; trocar por outro provedor (aberto hospedado ou comercial) é só configuração |
| Embeddings | **`bge-m3`** (1024 dimensões), mesma interface compatível com OpenAI (`EMBEDDING_BASE_URL`) | Aberto, multilíngue, bom em português. O mesmo modelo deve ser usado na indexação e na consulta |
| Busca do guia | pgvector + full-text `portuguese` do Postgres | Busca híbrida; full-text é o fallback se o serviço de embeddings estiver fora |
| Hospedagem web | Exportação estática do Expo em hospedagem gratuita (GitHub Pages, Netlify, Vercel ou EAS Hosting) | Custo zero, sem servidor para manter |

**Alternativa descartada:** Kotlin + Jetpack Compose (experiência da Brunna). Perderia a versão web para demonstração e o painel na mesma linguagem.

## Estrutura do repositório

```
arandu/
├── CLAUDE.md
├── README.md
├── docs/
├── assets/
│   └── brand/                # logo, cores, fontes
├── apps/
│   ├── mobile/               # Expo app (Android, iOS, web)
│   │   ├── app/              # rotas (expo-router)
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── map/          # mapa, revelação, proximidade
│   │   │   ├── points/       # cartão do ponto, desafio
│   │   │   ├── daily/        # nome escondido, mito ou fato
│   │   │   ├── trails/
│   │   │   ├── guide/        # chat do guia
│   │   │   └── classroom/    # modo turma
│   │   ├── lib/              # supabase client, h3, geo utils
│   │   └── tests/
│   └── admin/                # painel de curadoria
├── supabase/
│   ├── migrations/           # esquema SQL versionado
│   ├── seed/                 # conteúdo curado com fontes (JSON/SQL)
│   └── functions/
│       └── guide/            # Edge Function do guia (RAG)
└── pipeline/
    ├── pyproject.toml
    ├── arandu_pipeline/
    │   ├── ingest.py         # documentos de entrada
    │   ├── transcribe.py     # OCR / modelo de visão
    │   ├── extract.py        # entidades estruturadas
    │   ├── geocode.py
    │   ├── toponyms.py
    │   └── publish.py        # envia propostas ao Supabase
    ├── data/
    │   ├── raw/              # documentos em domínio público
    │   └── processed/
    ├── notebooks/            # demonstração passo a passo
    └── tests/
```

## Decisões de arquitetura

1. **O app só lê conteúdo publicado.** Políticas de Row Level Security (RLS) garantem que o cliente veja apenas `status = 'publicado'` e `sensibilidade <> 'restrito'`.
2. **Localização do usuário fica no dispositivo.** O cálculo de proximidade é local; o servidor recebe só o ID do ponto descoberto.
3. **Progresso offline-first.** Descobertas são salvas localmente e sincronizadas quando houver conexão.
4. **Usuário anônimo por padrão.** Supabase Auth anônimo; o modo turma usa código de turma, sem e-mail de estudante.
5. **O guia roda no servidor.** A Edge Function recupera trechos do conteúdo publicado (busca híbrida), monta o prompt com as fontes e devolve resposta com citações. Endereço, modelo e chave do LLM ficam só no servidor (secrets do Supabase), nunca no app.
6. **O pipeline escreve só propostas.** Ele nunca publica; tudo entra como `proposta_ia` no banco.
7. **Código aberto.** Código sob licença MIT. O conteúdo tem licença própria, definida com as comunidades (ver `docs/07`).
8. **Provedor de IA trocável.** Pipeline e guia falam com qualquer endpoint compatível com a API da OpenAI (Ollama, provedores de modelos abertos ou APIs comerciais). Nenhum código depende de um fornecedor específico.
9. **Degradação segura do guia.** Se o LLM falhar ou demorar além do limite, o guia mostra os trechos recuperados com suas fontes ("modo trechos"), sem gerar texto. Se nada for recuperado, diz que ainda não tem informação validada.
10. **Versões fixadas.** SDK do Expo, dependências (`package-lock.json`, `uv.lock`) e modelos (tag exata do Ollama) são fixados e registrados. Atualizar é uma decisão explícita, nunca automática.

## Custos e confiabilidade no protótipo

Meta: **custo fixo zero** e demonstração que não falha na entrevista.

| Item | Custo | Risco | Mitigação |
| --- | --- | --- | --- |
| Expo / EAS | Grátis (builds locais ou cota gratuita do EAS) | Fila lenta no plano gratuito | Build local com `npx expo run:android` |
| Supabase (free) | Grátis | Projeto **pausa após ~1 semana sem uso**; limites de banco e banda | Workflow agendado no GitHub Actions faz uma consulta leve a cada poucos dias; reativar e testar no dia anterior a qualquer demonstração |
| Tiles do mapa | Grátis | Serviço gratuito de terceiros fora do ar | URL do estilo configurável; plano B com PMTiles do recorte no Supabase Storage |
| LLM e embeddings | Grátis (Ollama local) | Notebook desligado = guia sem LLM | "Modo trechos" e fallback full-text (decisões 9 e busca híbrida); para a banca, endpoint estável (provedor de modelo aberto ou API comercial com teto de gasto) |
| Nominatim | Grátis | Política de uso: 1 requisição/s, User-Agent identificável | Limitador no `geocode.py`, cache de resultados, User-Agent genérico do projeto |
| Hospedagem web | Grátis | — | Exportação estática; sem servidor |
| iOS | Adiado (US$ 99/ano) | — | Código compatível; liberar quando houver motivo |
| Play Store | Adiado (US$ 25, uma vez) | — | APK instalado direto no celular para o protótipo |

Regras para manter o custo em zero e evitar surpresas:

- Se algum provedor pago for usado, **definir teto de gasto no painel do provedor** antes de colocar a chave.
- Limite de perguntas por usuário no guia (`GUIDE_RATE_LIMIT_PER_HOUR`) e limite de tokens por resposta (`GUIDE_MAX_OUTPUT_TOKENS`).
- Cache de transcrições, extrações e embeddings: nada é reprocessado sem necessidade.
- **Plano B da demonstração:** vídeo gravado do roteiro de 3 minutos, caso a rede falhe na entrevista.

## Variáveis de ambiente

O modelo está em [`.env.example`](../.env.example). Variáveis com prefixo `EXPO_PUBLIC_` vão para o código do app e **não podem conter segredos**. As variáveis do guia são configuradas como secrets do Supabase (`supabase secrets set`), não no app.

## Qualidade

- Testes unitários para: revelação de células H3, cálculo de proximidade, regras de progresso e meta semanal, filtros de publicação, recuperação do RAG.
- Teste de ponta a ponta do roteiro de demonstração.
- Lint e formatação automáticos (ESLint/Prettier no app, Ruff no pipeline).
- CI simples (GitHub Actions) rodando testes em cada PR. O repositório é **privado** por enquanto: a cota gratuita mensal de minutos basta para o protótipo; manter os jobs enxutos.
- Testes de degradação: guia sem LLM (modo trechos), sem embeddings (só full-text) e app sem rede (progresso local).
- Teste de segurança das RLS: o cliente anônimo não consegue ler pontos fora de `publicado` nem conteúdo `restrito`.
