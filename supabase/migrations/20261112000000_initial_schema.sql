-- Initial schema. Source of truth: docs/05-modelo-de-dados.md
-- Deviations from docs/05 are recorded in docs/decisoes.md.

create extension if not exists postgis with schema extensions;
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.point_status as enum (
  'proposta_ia', 'revisao_pesquisa', 'validacao_comunidade',
  'publicado', 'rejeitado', 'restrito'
);
create type public.heritage_type as enum ('indigena', 'afro_brasileira', 'ambas');
create type public.sensitivity as enum ('aberto', 'cuidado', 'restrito');
create type public.source_kind as enum (
  'documento_historico', 'artigo_academico', 'noticia',
  'livro', 'orgao_publico', 'relato_comunitario', 'outro'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.partner (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,             -- comunidade, coletivo, museu, universidade...
  contact text,
  consent_terms text,             -- agreed terms of use for the content
  created_at timestamptz not null default now()
);

create table public.source (
  id uuid primary key default gen_random_uuid(),
  kind public.source_kind not null,
  title text not null,
  author text,
  publisher text,
  published_at date,
  url text,
  license text,                   -- domínio público, CC-BY, uso autorizado...
  notes text,
  created_at timestamptz not null default now()
);

create table public.point (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  body text not null,
  location extensions.geography(point, 4326) not null,
  unlock_radius_m int not null default 75 check (unlock_radius_m between 10 and 1000),
  city text not null,
  neighborhood text,
  heritage public.heritage_type not null,
  peoples text[],                 -- as the peoples/communities name themselves
  period_label text,
  status public.point_status not null default 'revisao_pesquisa',
  sensitivity public.sensitivity not null default 'aberto',
  authored_by uuid references public.partner(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index point_location_idx on public.point using gist (location);
create index point_status_idx on public.point (status);

create table public.point_source (
  point_id uuid references public.point(id) on delete cascade,
  source_id uuid references public.source(id),
  locator text,                   -- page, excerpt, minute
  primary key (point_id, source_id)
);

create table public.challenge (
  id uuid primary key default gen_random_uuid(),
  point_id uuid references public.point(id) on delete cascade,
  kind text not null check (kind in ('multipla_escolha', 'mito_ou_fato')),
  prompt text not null,
  options jsonb not null,         -- [{id, text}]
  correct_option text not null,
  explanation text not null,
  source_id uuid references public.source(id)
);

create table public.toponym (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  language text not null,
  meaning text not null,          -- only with a verified source
  explanation text,
  distractors jsonb not null,
  source_id uuid not null references public.source(id),
  status public.point_status not null default 'revisao_pesquisa'
);

create table public.trail (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  city text not null,
  estimated_minutes int,
  -- Not in docs/05: trails need a status so drafts are not exposed (see decisoes.md).
  status public.point_status not null default 'revisao_pesquisa'
);
create table public.trail_point (
  trail_id uuid references public.trail(id) on delete cascade,
  point_id uuid references public.point(id),
  position int not null,
  primary key (trail_id, point_id)
);

create table public.validation (
  id uuid primary key default gen_random_uuid(),
  point_id uuid references public.point(id) on delete cascade,
  from_status public.point_status,
  to_status public.point_status not null,
  reviewer_name text not null,
  reviewer_role text not null,    -- pesquisador, comunidade, curadoria
  partner_id uuid references public.partner(id),
  comment text,
  created_at timestamptz not null default now()
);

create table public.ai_proposal (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.source(id),
  raw_excerpt text not null,
  extracted jsonb not null,
  suggested_location extensions.geography(point, 4326),
  location_confidence real,
  model text not null,            -- exact model tag, for traceability
  created_point_id uuid references public.point(id),
  created_at timestamptz not null default now()
);

create table public.discovery (
  user_id uuid not null,          -- anonymous Supabase Auth user; no coordinates stored
  point_id uuid references public.point(id),
  mode text not null check (mode in ('presencial', 'remota')),
  challenge_correct boolean,
  discovered_at timestamptz not null default now(),
  primary key (user_id, point_id)
);

create table public.classroom (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  teacher_user_id uuid not null,
  created_at timestamptz not null default now()
);
create table public.classroom_member (
  classroom_id uuid references public.classroom(id) on delete cascade,
  user_id uuid not null,
  display_name text,              -- nickname only, never a full name
  primary key (classroom_id, user_id)
);

create table public.content_chunk (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.point(id) on delete cascade,
  source_id uuid references public.source(id),
  text text not null,
  embedding extensions.vector(1024),  -- bge-m3
  -- Portuguese full-text search: hybrid retrieval and fallback when embeddings are down.
  fts tsvector generated always as (to_tsvector('portuguese', text)) stored
);
create index content_chunk_fts_idx on public.content_chunk using gin (fts);
create index content_chunk_embedding_idx on public.content_chunk
  using hnsw (embedding extensions.vector_cosine_ops);

-- Not in docs/05: who may use the curation panel (see decisoes.md).
-- Managed only with the service role.
create table public.curator (
  user_id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Keep updated_at / published_at consistent.
create function public.point_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status and new.status = 'publicado' then
    new.published_at := now();
  end if;
  return new;
end;
$$;
create trigger point_before_update
  before update on public.point
  for each row execute function public.point_before_update();

-- Rule 5 (CLAUDE.md): only published, non-restricted content may reach the guide.
create function public.content_chunk_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.point p
    where p.id = new.point_id
      and p.status = 'publicado'
      and p.sensitivity <> 'restrito'
  ) then
    raise exception 'content_chunk requires a published, non-restricted point (point_id=%)', new.point_id;
  end if;
  return new;
end;
$$;
create trigger content_chunk_guard
  before insert or update on public.content_chunk
  for each row execute function public.content_chunk_guard();

-- When a point leaves "publicado" or becomes restricted, drop it from the guide index.
create function public.point_purge_chunks() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status <> 'publicado' or new.sensitivity = 'restrito' then
    delete from public.content_chunk where point_id = new.id;
  end if;
  return null;
end;
$$;
create trigger point_purge_chunks
  after update of status, sensitivity on public.point
  for each row execute function public.point_purge_chunks();
