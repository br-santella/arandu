# 01 — Visão geral

## Contexto

Quem usa o Arandu e com quais sistemas externos ele conversa.

```mermaid
flowchart LR
  est["Estudante / público geral"]
  prof["Professor"]
  cur["Curadoria e pesquisadores"]
  com["Comunidades parceiras"]

  arandu(["Arandu"])

  acervo[("Acervos históricos<br/>em domínio público")]
  osm["OpenStreetMap<br/>Nominatim e tiles do mapa"]
  llm["Provedor de LLM e embeddings<br/>Ollama ou API compatível"]

  est -- "explora o mapa, descobre pontos,<br/>responde desafios, pergunta ao guia" --> arandu
  prof -- "cria turma, acompanha<br/>progresso agregado" --> arandu
  cur -- "revisa propostas da IA,<br/>edita e publica" --> arandu
  com -- "valida, assina<br/>ou restringe conteúdo" --> arandu

  acervo -- "documentos" --> arandu
  arandu -- "geocodificação,<br/>tiles" --> osm
  arandu -- "extração e respostas<br/>do guia" --> llm
```

## Contêineres

Os blocos que compõem o sistema e como se ligam.

```mermaid
flowchart TB
  subgraph device["Dispositivo do usuário"]
    app["apps/mobile<br/>Expo + TypeScript<br/>Android e web"]
    gps["Localização<br/>nunca sai do aparelho"]
    store[("Progresso local<br/>offline-first")]
    gps --> app
    app <--> store
  end

  subgraph team["Máquina da equipe"]
    pipe["pipeline/<br/>Python + uv"]
    tess["Tesseract OCR"]
    ollama["Ollama<br/>qwen3.5:9b + qwen3-embedding:0.6b"]
    raw[("Documentos<br/>pipeline/data")]
    raw --> pipe
    pipe --> tess
    pipe --> ollama
  end

  subgraph sb["Supabase"]
    db[("Postgres<br/>PostGIS, pgvector, full-text pt")]
    auth["Auth anônimo"]
    stor[("Storage<br/>imagens, PMTiles")]
    guide["Edge Function guide<br/>RAG"]
    guide --> db
  end

  admin["apps/admin<br/>painel de curadoria"]
  tiles["Tiles do mapa<br/>OpenFreeMap ou PMTiles"]
  llmext["Endpoint de LLM<br/>compatível com OpenAI"]

  app -- "lê só conteúdo publicado (RLS)<br/>grava discovery sem coordenadas" --> db
  app -- "login anônimo" --> auth
  app -- "pergunta" --> guide
  app -- "estilo e tiles" --> tiles
  guide -- "geração e embedding<br/>da pergunta" --> llmext
  pipe -- "service role:<br/>grava só ai_proposal" --> db
  admin -- "curador autenticado (RLS)" --> db
```

## Implantação no protótipo (custo fixo zero)

```mermaid
flowchart LR
  subgraph gh["GitHub — repositório privado"]
    repo["Código e docs"]
    ci["Actions: lint e testes"]
    keep["Actions agendada:<br/>keep-alive do Supabase"]
  end

  subgraph host["Hospedagem estática gratuita"]
    web["App web exportado"]
  end

  subgraph sbfree["Supabase — plano gratuito"]
    sbdb[("Banco + Auth + Storage<br/>+ Edge Functions")]
  end

  subgraph local["Notebook da equipe"]
    pl["Pipeline + Ollama<br/>RTX 4060 8 GB"]
  end

  apk["APK Android<br/>instalado direto"]
  demo["Endpoint estável do guia<br/>só para a banca, com teto de gasto"]

  repo --> ci
  repo -- "build" --> web
  repo -- "build local" --> apk
  keep -. "consulta leve" .-> sbdb
  web --> sbdb
  apk --> sbdb
  pl --> sbdb
  sbdb -. "guia" .-> demo
```

Riscos e mitigações dos planos gratuitos estão em [`docs/04-arquitetura-tecnica.md`](../04-arquitetura-tecnica.md#custos-e-confiabilidade-no-protótipo).

## Estado dos componentes

| Componente | Local | Estado |
| --- | --- | --- |
| Esquema do banco | `supabase/migrations/20261112000000_initial_schema.sql` | 🟢 Implementado |
| Políticas RLS | `supabase/migrations/20261112000100_rls.sql` | 🟢 Implementado |
| Testes de RLS e do índice do guia | `supabase/tests/database/rls.test.sql` | 🟢 Implementado |
| Seed do piloto | `supabase/seed/` | ⚪ Planejado (depende do conteúdo da equipe) |
| App Expo: base (tema, fontes, rotas, boas-vindas) | `apps/mobile/src/` | 🟢 Implementado (12 testes, typecheck, lint e export web ok; ainda não aberto num aparelho) |
| App Expo: telas de mapa, cartão, desafios, guia | `apps/mobile/src/app/` | ⚪ Planejado (rotas vazias, M2–M6) |
| Painel de curadoria | `apps/admin/` | ⚪ Planejado |
| Pipeline: configuração e cliente de IA trocável | `pipeline/arandu_pipeline/config.py`, `llm.py` | 🟢 Implementado (14 testes com endpoint simulado; saída estruturada e embeddings verificados contra `qwen3.5:9b` e `qwen3-embedding:0.6b` reais) |
| Pipeline: etapas ingest → publish | `pipeline/arandu_pipeline/` | ⚪ Planejado (M4) |
| Guia (Edge Function) | `supabase/functions/guide/` | ⚪ Planejado |
| CI (mobile, pipeline, database) e keep-alive | `.github/workflows/` | 🟢 Implementado (os três workflows passaram no GitHub; keep-alive confirmou o projeto remoto ativo) |

## Princípios que a arquitetura garante

| Princípio (CLAUDE.md) | Onde é garantido |
| --- | --- |
| A IA propõe, pessoas decidem | Pipeline só grava `ai_proposal` e pontos em `proposta_ia`; só a curadoria muda status (RLS) |
| Guia só responde com conteúdo validado | Triggers impedem indexar pontos não publicados ou restritos; ver [04 — Fluxos](04-fluxos.md#guia-rag) |
| Privacidade de estudantes | Proximidade calculada no aparelho; `discovery` não tem coordenadas; usuário anônimo |
| Conteúdo restrito nunca exibido nem enviado ao LLM | RLS filtra `sensitivity <> 'restrito'`; trigger apaga os chunks do ponto |
| Custo mínimo | Modelos abertos locais, planos gratuitos, provedor trocável por `.env` |
