# 02 — Modelo de dados

Estado: 🟢 **Implementado** (migrations aplicadas e testadas localmente). Fonte de verdade: [`supabase/migrations/`](../../supabase/migrations/). A descrição de produto de cada entidade está em [`docs/05-modelo-de-dados.md`](../05-modelo-de-dados.md).

## Diagrama de classes (UML)

Agrupado em quatro áreas: **conteúdo** (o que o app mostra), **curadoria** (o que leva o conteúdo à publicação), **uso** (o que o usuário faz) e **guia** (índice para o RAG).

```mermaid
classDiagram
  direction LR

  %% ---------- Conteúdo ----------
  class point {
    +uuid id
    +text slug
    +text title
    +text summary
    +text body
    +geography location
    +int unlock_radius_m
    +text city
    +text neighborhood
    +heritage_type heritage
    +text[] peoples
    +text period_label
    +point_status status
    +sensitivity sensitivity
    +uuid authored_by
    +timestamptz published_at
    +timestamptz updated_at
  }
  class source {
    +uuid id
    +source_kind kind
    +text title
    +text author
    +text publisher
    +date published_at
    +text url
    +text license
  }
  class point_source {
    +uuid point_id
    +uuid source_id
    +text locator
  }
  class challenge {
    +uuid id
    +uuid point_id
    +text kind
    +text prompt
    +jsonb options
    +text correct_option
    +text explanation
    +uuid source_id
  }
  class toponym {
    +uuid id
    +text name
    +text city
    +text language
    +text meaning
    +jsonb distractors
    +uuid source_id
    +point_status status
  }
  class trail {
    +uuid id
    +text title
    +text city
    +int estimated_minutes
    +point_status status
  }
  class trail_point {
    +uuid trail_id
    +uuid point_id
    +int position
  }

  %% ---------- Curadoria ----------
  class partner {
    +uuid id
    +text name
    +text kind
    +text consent_terms
  }
  class validation {
    +uuid id
    +uuid point_id
    +point_status from_status
    +point_status to_status
    +text reviewer_name
    +text reviewer_role
    +uuid partner_id
    +text comment
  }
  class ai_proposal {
    +uuid id
    +uuid source_id
    +text raw_excerpt
    +jsonb extracted
    +geography suggested_location
    +real location_confidence
    +text model
    +uuid created_point_id
  }
  class curator {
    +uuid user_id
    +text name
  }

  %% ---------- Uso ----------
  class auth_users {
    <<Supabase Auth>>
    +uuid id
  }
  class discovery {
    +uuid user_id
    +uuid point_id
    +text mode
    +bool challenge_correct
    +timestamptz discovered_at
  }
  class classroom {
    +uuid id
    +text code
    +text name
    +uuid teacher_user_id
  }
  class classroom_member {
    +uuid classroom_id
    +uuid user_id
    +text display_name
  }

  %% ---------- Guia ----------
  class content_chunk {
    +uuid id
    +uuid point_id
    +uuid source_id
    +text text
    +vector_1024 embedding
    +tsvector fts
  }

  %% ---------- Enums ----------
  class point_status {
    <<enumeration>>
    proposta_ia
    revisao_pesquisa
    validacao_comunidade
    publicado
    rejeitado
    restrito
  }
  class sensitivity {
    <<enumeration>>
    aberto
    cuidado
    restrito
  }
  class heritage_type {
    <<enumeration>>
    indigena
    afro_brasileira
    ambas
  }
  class source_kind {
    <<enumeration>>
    documento_historico
    artigo_academico
    noticia
    livro
    orgao_publico
    relato_comunitario
    outro
  }

  %% ---------- Relações ----------
  point "1" -- "0..*" point_source
  source "1" -- "0..*" point_source
  point "1" *-- "0..*" challenge : desafios
  challenge "0..*" --> "0..1" source : cita
  toponym "0..*" --> "1" source : cita
  trail "1" *-- "0..*" trail_point
  point "1" -- "0..*" trail_point
  partner "0..1" <-- "0..*" point : authored_by
  point "1" *-- "0..*" validation : histórico
  partner "0..1" <-- "0..*" validation
  source "0..1" <-- "0..*" ai_proposal : origem
  ai_proposal "0..*" --> "0..1" point : created_point_id
  auth_users "1" -- "0..1" curator
  auth_users "1" -- "0..*" discovery
  point "1" -- "0..*" discovery
  auth_users "1" -- "0..*" classroom : professor
  classroom "1" *-- "0..*" classroom_member
  auth_users "1" -- "0..*" classroom_member
  point "1" *-- "0..*" content_chunk : indexado
  source "0..1" <-- "0..*" content_chunk

  point ..> point_status
  point ..> sensitivity
  point ..> heritage_type
  source ..> source_kind
```

Notas de leitura:

- `*--` (composição): apagar o ponto apaga seus desafios, validações e chunks (`on delete cascade`).
- `auth_users` é a tabela `auth.users` do Supabase. As colunas `user_id` e `teacher_user_id` guardam esse id, sem chave estrangeira formal.
- `discovery` **não tem coordenadas** do usuário: só `user_id`, `point_id`, modo e resultado.

## Diferenças em relação à doc 05

| Mudança | Motivo | Decisão |
| --- | --- | --- |
| Tabela `curator` | RLS precisa distinguir curadoria de usuário anônimo | [decisoes.md](../decisoes.md) |
| `trail.status` | Trilha em rascunho não pode aparecer no app | [decisoes.md](../decisoes.md) |
| `content_chunk.point_id` obrigatório | Todo chunk pertence a um ponto publicado | [decisoes.md](../decisoes.md) |
| `content_chunk.fts` (full-text `portuguese`) | Busca híbrida e fallback sem embeddings | [decisoes.md](../decisoes.md) |
| `unlock_radius_m` entre 10 e 1000 | Evita raio inválido | — |

## Triggers e funções

| Nome | Tipo | O que faz |
| --- | --- | --- |
| `point_before_update` | trigger `before update` em `point` | Atualiza `updated_at`; preenche `published_at` ao entrar em `publicado` |
| `content_chunk_guard` | trigger `before insert/update` em `content_chunk` | Recusa chunk de ponto não publicado ou restrito |
| `point_purge_chunks` | trigger `after update of status, sensitivity` em `point` | Apaga os chunks quando o ponto sai de `publicado` ou vira `restrito` |
| `is_curator()` | função `security definer` | O usuário atual está em `curator`? |
| `is_point_public(id)` | função `security definer` | Ponto publicado e não restrito? |
| `is_source_public(id)` | função `security definer` | Fonte ligada a ponto, desafio ou topônimo publicado? |
| `is_classroom_member(id)` | função `security definer` | O usuário atual é membro da turma? |

## Índices

| Índice | Uso |
| --- | --- |
| `point_location_idx` (GiST) | Pontos próximos e por área |
| `point_status_idx` | Filtro de publicados |
| `content_chunk_fts_idx` (GIN) | Busca full-text em português |
| `content_chunk_embedding_idx` (HNSW, cosseno) | Busca vetorial do guia |
