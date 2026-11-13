-- Admin areas: automatic estado/município assignment and public area totals.
-- Fixtures use fictitious square areas and codes; no real geography.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- Isolate from seed data (e.g. dev test points); undone by the final rollback.
delete from public.discovery;
delete from public.point;

-- A fictitious "estado" (code 99) covering lon/lat -1..1, and a "município"
-- (9900001) covering 0..1 inside it.
insert into public.admin_area (code, level, name, geom) values
  ('99', 'estado', '[TESTE] Estado',
   extensions.st_multi(extensions.st_geomfromtext('POLYGON((-1 -1, 1 -1, 1 1, -1 1, -1 -1))', 4326))),
  ('9900001', 'municipio', '[TESTE] Município',
   extensions.st_multi(extensions.st_geomfromtext('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))', 4326)));
update public.admin_area set state_code = '99' where code = '9900001';

insert into public.point (id, slug, title, summary, body, location, city, heritage, status, sensitivity) values
  ('00000000-0000-0000-0000-0000000000e1', 'teste-dentro-municipio', '[TESTE]', '[TESTE]', '[TESTE]',
   'SRID=4326;POINT(0.5 0.5)', 'Teste', 'ambas', 'publicado', 'aberto'),
  ('00000000-0000-0000-0000-0000000000e2', 'teste-so-estado', '[TESTE]', '[TESTE]', '[TESTE]',
   'SRID=4326;POINT(-0.5 -0.5)', 'Teste', 'ambas', 'publicado', 'aberto'),
  ('00000000-0000-0000-0000-0000000000e3', 'teste-fora', '[TESTE]', '[TESTE]', '[TESTE]',
   'SRID=4326;POINT(5 5)', 'Teste', 'ambas', 'publicado', 'aberto'),
  ('00000000-0000-0000-0000-0000000000e4', 'teste-rascunho', '[TESTE]', '[TESTE]', '[TESTE]',
   'SRID=4326;POINT(0.6 0.6)', 'Teste', 'ambas', 'revisao_pesquisa', 'aberto'),
  ('00000000-0000-0000-0000-0000000000e5', 'teste-restrito', '[TESTE]', '[TESTE]', '[TESTE]',
   'SRID=4326;POINT(0.7 0.7)', 'Teste', 'ambas', 'publicado', 'restrito');

-- Trigger assignment
select results_eq(
  $$select state_code, municipality_code from public.point where slug = 'teste-dentro-municipio'$$,
  $$values ('99'::text, '9900001'::text)$$,
  'point inside a município gets estado and município codes');

select results_eq(
  $$select state_code, municipality_code from public.point where slug = 'teste-so-estado'$$,
  $$values ('99'::text, null::text)$$,
  'point outside any município gets only the estado code');

select results_eq(
  $$select state_code, municipality_code from public.point where slug = 'teste-fora'$$,
  $$values (null::text, null::text)$$,
  'point outside all areas gets no codes');

update public.point set location = 'SRID=4326;POINT(5 5)' where slug = 'teste-so-estado';
select is(
  (select state_code from public.point where slug = 'teste-so-estado'), null,
  'moving a point updates its codes');

-- Backfill after (re)loading areas
update public.point set state_code = null, municipality_code = null
  where slug = 'teste-dentro-municipio';
select is(public.refresh_point_admin_codes() >= 1, true, 'refresh recomputes stale codes');
select is(
  (select municipality_code from public.point where slug = 'teste-dentro-municipio'), '9900001',
  'refresh restores the município code');

-- Public view as an anonymous visitor
set local role anon;

select results_eq(
  $$select code, total_points from public.area_with_points order by code$$,
  $$values ('99'::text, 1), ('9900001'::text, 1)$$,
  'area totals count only published, non-restricted points');

select isnt_empty(
  $$select 1 from public.area_with_points where geometry ? 'coordinates'$$,
  'areas come with a GeoJSON geometry');

select isnt_empty($$select 1 from public.admin_area$$, 'anon can read admin areas (public data)');

select throws_ok(
  $$insert into public.admin_area (code, level, name, geom)
    values ('98', 'estado', 'x', extensions.st_multi(extensions.st_geomfromtext('POLYGON((0 0,1 0,1 1,0 1,0 0))', 4326)))$$,
  '42501', null, 'anon cannot write admin areas');

select results_eq(
  $$select slug from public.published_point order by slug$$,
  $$values ('teste-dentro-municipio'::text), ('teste-fora'::text), ('teste-so-estado'::text)$$,
  'published_point lists only published, non-restricted points');

select results_eq(
  $$select lat, lng from public.published_point where slug = 'teste-dentro-municipio'$$,
  $$values (0.5::float8, 0.5::float8)$$,
  'published_point exposes lat/lng as numbers');

select * from finish();
rollback;
