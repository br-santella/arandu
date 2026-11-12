# 05 — Modelo de dados

## Entidades

| Entidade | O que é |
| --- | --- |
| `source` | Fonte de informação: documento histórico, artigo, notícia, livro, relato comunitário |
| `point` | Um lugar com história indígena e/ou afro-brasileira, exibido no mapa |
| `point_source` | Ligação entre ponto e fontes |
| `challenge` | Pergunta associada a um ponto (múltipla escolha ou mito/fato) |
| `toponym` | Nome de lugar com origem verificada, usado no "Nome escondido" |
| `trail` / `trail_point` | Trilha e a ordem dos seus pontos |
| `validation` | Registro de cada revisão (quem, quando, decisão, comentário) |
| `ai_proposal` | Saída do pipeline de IA aguardando curadoria |
| `community` / `partner` | Comunidades e instituições parceiras que validam e assinam conteúdo |
| `discovery` | Ponto descoberto por um usuário (sem coordenadas do usuário) |
| `classroom` / `classroom_member` | Turma e participantes (modo turma) |
| `content_chunk` | Trechos do conteúdo publicado com embeddings, para o guia |

## Ciclo de vida de um ponto

```
proposta_ia ──▶ revisao_pesquisa ──▶ validacao_comunidade ──▶ publicado
      │                 │                     │
      └────────────▶ rejeitado ◀──────────────┘
                        
Qualquer estado ──▶ restrito   (conteúdo sensível: nunca exibido nem enviado ao LLM)
```

- Pontos criados manualmente pela curadoria começam em `revisao_pesquisa`.
- Só `publicado` aparece no app.
- Toda transição gera um registro em `validation`.
- Um ponto publicado pode voltar para revisão (correção ou pedido da comunidade).

## Esquema SQL inicial (Postgres + PostGIS + pgvector)

```sql
create extension if not exists postgis;
create extension if not exists vector;

create type point_status as enum (
  'proposta_ia', 'revisao_pesquisa', 'validacao_comunidade',
  'publicado', 'rejeitado', 'restrito'
);
create type heritage_type as enum ('indigena', 'afro_brasileira', 'ambas');
create type sensitivity as enum ('aberto', 'cuidado', 'restrito');
create type source_kind as enum (
  'documento_historico', 'artigo_academico', 'noticia',
  'livro', 'orgao_publico', 'relato_comunitario', 'outro'
);

create table partner (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,             -- comunidade, coletivo, museu, universidade...
  contact text,
  consent_terms text,             -- termos acordados de uso do conteúdo
  created_at timestamptz default now()
);

create table source (
  id uuid primary key default gen_random_uuid(),
  kind source_kind not null,
  title text not null,
  author text,
  publisher text,
  published_at date,
  url text,
  license text,                   -- domínio público, CC-BY, uso autorizado...
  notes text,
  created_at timestamptz default now()
);

create table point (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,          -- 1-2 frases para o mapa
  body text not null,             -- cartão de 1-2 min
  location geography(point, 4326) not null,
  unlock_radius_m int not null default 75,
  city text not null,
  neighborhood text,
  heritage heritage_type not null,
  peoples text[],                 -- nomes dos povos/comunidades, como eles se nomeiam
  period_label text,              -- ex.: "século 18", "c. 1560"
  status point_status not null default 'revisao_pesquisa',
  sensitivity sensitivity not null default 'aberto',
  authored_by uuid references partner(id),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index point_location_idx on point using gist (location);

create table point_source (
  point_id uuid references point(id) on delete cascade,
  source_id uuid references source(id),
  locator text,                   -- página, trecho, minuto
  primary key (point_id, source_id)
);

create table challenge (
  id uuid primary key default gen_random_uuid(),
  point_id uuid references point(id) on delete cascade,
  kind text not null check (kind in ('multipla_escolha', 'mito_ou_fato')),
  prompt text not null,
  options jsonb not null,         -- [{id, text}]
  correct_option text not null,
  explanation text not null,
  source_id uuid references source(id)
);

create table toponym (
  id uuid primary key default gen_random_uuid(),
  name text not null,             -- ex.: "Anhangabaú"
  city text,
  language text not null,         -- língua de origem
  meaning text not null,          -- só com fonte verificada
  explanation text,
  distractors jsonb not null,     -- opções erradas para o desafio
  source_id uuid not null references source(id),
  status point_status not null default 'revisao_pesquisa'
);

create table trail (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  city text not null,
  estimated_minutes int
);
create table trail_point (
  trail_id uuid references trail(id) on delete cascade,
  point_id uuid references point(id),
  position int not null,
  primary key (trail_id, point_id)
);

create table validation (
  id uuid primary key default gen_random_uuid(),
  point_id uuid references point(id) on delete cascade,
  from_status point_status,
  to_status point_status not null,
  reviewer_name text not null,
  reviewer_role text not null,    -- pesquisador, comunidade, curadoria
  partner_id uuid references partner(id),
  comment text,
  created_at timestamptz default now()
);

create table ai_proposal (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references source(id),
  raw_excerpt text not null,      -- trecho do documento que originou a proposta
  extracted jsonb not null,       -- entidades extraídas (ver docs/06)
  suggested_location geography(point, 4326),
  location_confidence real,
  model text not null,
  created_point_id uuid references point(id),
  created_at timestamptz default now()
);

create table discovery (
  user_id uuid not null,          -- usuário anônimo do Supabase Auth
  point_id uuid references point(id),
  mode text not null check (mode in ('presencial', 'remota')),
  challenge_correct boolean,
  discovered_at timestamptz default now(),
  primary key (user_id, point_id)
);

create table classroom (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  teacher_user_id uuid not null,
  created_at timestamptz default now()
);
create table classroom_member (
  classroom_id uuid references classroom(id) on delete cascade,
  user_id uuid not null,
  display_name text,              -- apelido escolhido, sem nome completo
  primary key (classroom_id, user_id)
);

create table content_chunk (
  id uuid primary key default gen_random_uuid(),
  point_id uuid references point(id) on delete cascade,
  source_id uuid references source(id),
  text text not null,
  embedding vector(1024)          -- ajustar à dimensão do modelo escolhido
);
```

## Políticas de acesso (RLS) — resumo

| Tabela | App (anônimo) | Curadoria (admin) | Pipeline (service role) |
| --- | --- | --- | --- |
| `point`, `challenge`, `toponym`, `trail*` | leitura só de `publicado` e não `restrito` | leitura e escrita | escrita apenas via `ai_proposal` |
| `source`, `point_source` | leitura das fontes ligadas a pontos publicados | leitura e escrita | escrita |
| `discovery` | o próprio usuário lê e escreve as suas | leitura agregada | — |
| `classroom*` | membros leem a própria turma | leitura | — |
| `validation`, `ai_proposal`, `partner` | sem acesso | leitura e escrita | escrita em `ai_proposal` |
| `content_chunk` | sem acesso direto (só via Edge Function) | leitura | escrita |

## Formato do seed

O seed fica em `supabase/seed/` como JSON legível por humanos, para que a equipe edite conteúdo sem SQL. Exemplo de estrutura (o conteúdo real é escrito pela curadoria):

```json
{
  "slug": "cemiterio-dos-aflitos",
  "title": "Cemitério dos Aflitos",
  "summary": "[escrito pela curadoria]",
  "body": "[escrito pela curadoria]",
  "location": { "lat": 0, "lng": 0 },
  "city": "São Paulo",
  "neighborhood": "Liberdade",
  "heritage": "ambas",
  "period_label": "século 18",
  "status": "revisao_pesquisa",
  "sources": [
    { "title": "[título da matéria]", "publisher": "Brasil de Fato", "url": "[url]" }
  ]
}
```

Coordenadas, textos e fontes devem ser preenchidos pela equipe a partir das fontes listadas no deck. O Claude Code não deve completar esses campos por conta própria.
