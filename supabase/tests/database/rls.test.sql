-- RLS and content-safety tests. Run with: supabase test db
-- All fixtures are fictitious test data.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- Isolate from seed data (e.g. dev test points); undone by the final rollback.
delete from public.discovery;
delete from public.point;

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, bypassing RLS)
-- ---------------------------------------------------------------------------
insert into public.point (id, slug, title, summary, body, location, city, heritage, status, sensitivity) values
  ('00000000-0000-0000-0000-0000000000a1', 'teste-publicado',
   '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
   'SRID=4326;POINT(0 0)', 'Cidade Teste', 'ambas', 'publicado', 'aberto'),
  ('00000000-0000-0000-0000-0000000000a2', 'teste-rascunho',
   '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
   'SRID=4326;POINT(0 0)', 'Cidade Teste', 'ambas', 'revisao_pesquisa', 'aberto'),
  ('00000000-0000-0000-0000-0000000000a3', 'teste-publicado-restrito',
   '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
   'SRID=4326;POINT(0 0)', 'Cidade Teste', 'ambas', 'publicado', 'restrito'),
  ('00000000-0000-0000-0000-0000000000a4', 'teste-proposta',
   '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
   'SRID=4326;POINT(0 0)', 'Cidade Teste', 'ambas', 'proposta_ia', 'aberto');

insert into public.source (id, kind, title) values
  ('00000000-0000-0000-0000-0000000000b1', 'outro', '[CONTEÚDO DE TESTE — NÃO PUBLICAR] fonte pública'),
  ('00000000-0000-0000-0000-0000000000b2', 'outro', '[CONTEÚDO DE TESTE — NÃO PUBLICAR] fonte de rascunho');

insert into public.point_source (point_id, source_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b2');

insert into public.ai_proposal (source_id, raw_excerpt, extracted, model) values
  ('00000000-0000-0000-0000-0000000000b2', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '{}', 'test-model');

insert into public.content_chunk (point_id, source_id, text) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]');

insert into public.curator (user_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', 'Curadoria Teste');

insert into public.discovery (user_id, point_id, mode) values
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000a1', 'remota');

-- ---------------------------------------------------------------------------
-- anon
-- ---------------------------------------------------------------------------
set local role anon;

select results_eq(
  'select slug from public.point',
  array['teste-publicado'],
  'anon sees only published, non-restricted points');

select is_empty('select 1 from public.ai_proposal', 'anon cannot read ai_proposal');
select is_empty('select 1 from public.content_chunk', 'anon cannot read content_chunk');

select results_eq(
  'select id from public.source',
  array['00000000-0000-0000-0000-0000000000b1'::uuid],
  'anon sees only sources linked to published points');

select throws_ok(
  $$insert into public.point (slug, title, summary, body, location, city, heritage)
    values ('x', 'x', 'x', 'x', 'SRID=4326;POINT(0 0)', 'x', 'ambas')$$,
  '42501', null, 'anon cannot insert points');

-- ---------------------------------------------------------------------------
-- regular (anonymous-auth) user d1
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$insert into public.discovery (user_id, point_id, mode)
    values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1', 'remota')$$,
  'user records a discovery of a published point');

select throws_ok(
  $$insert into public.discovery (user_id, point_id, mode)
    values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a2', 'remota')$$,
  '42501', null, 'user cannot record a discovery of an unpublished point');

select throws_ok(
  $$insert into public.discovery (user_id, point_id, mode)
    values ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a1', 'remota')$$,
  '42501', null, 'user cannot record a discovery for another user');

select results_eq(
  'select user_id from public.discovery',
  array['00000000-0000-0000-0000-0000000000d1'::uuid],
  'user sees only their own discoveries');

select is_empty(
  $$select 1 from public.point where status <> 'publicado'$$,
  'regular user cannot see unpublished points');

-- ---------------------------------------------------------------------------
-- curator c1
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  'select count(*)::int from public.point',
  array[4],
  'curator sees all points');

-- ---------------------------------------------------------------------------
-- Guide index safety (triggers)
-- ---------------------------------------------------------------------------
reset role;

select throws_ok(
  $$insert into public.content_chunk (point_id, text)
    values ('00000000-0000-0000-0000-0000000000a2', 'x')$$,
  'P0001', null, 'chunks cannot be indexed for unpublished points');

update public.point set sensitivity = 'restrito'
  where id = '00000000-0000-0000-0000-0000000000a1';

select is_empty(
  $$select 1 from public.content_chunk where point_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'marking a point restricted purges it from the guide index');

select * from finish();
rollback;
