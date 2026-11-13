-- Country shape and inner borders (no coastline). Fictitious square areas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- Isolate from seed and imported data; undone by the final rollback.
delete from public.discovery;
delete from public.point;
delete from public.admin_area;

-- Two adjacent "estados": 97 = [-1,0]x[-1,1], 96 = [0,1]x[-1,1].
-- "Município" 9700001 = [-1,0]x[0,1], the upper half of 97.
insert into public.admin_area (code, level, name, state_code, geom) values
  ('97', 'estado', '[TESTE] Oeste', null,
   extensions.st_multi(extensions.st_geomfromtext('POLYGON((-1 -1, 0 -1, 0 1, -1 1, -1 -1))', 4326))),
  ('96', 'estado', '[TESTE] Leste', null,
   extensions.st_multi(extensions.st_geomfromtext('POLYGON((0 -1, 1 -1, 1 1, 0 1, 0 -1))', 4326))),
  ('9700001', 'municipio', '[TESTE] Município', '97',
   extensions.st_multi(extensions.st_geomfromtext('POLYGON((-1 0, 0 0, 0 1, -1 1, -1 0))', 4326)));

select public.refresh_admin_derived(0.01);

select is(
  (select round(extensions.st_area(geom)::numeric, 6) from public.admin_area where code = 'BR'),
  4.000000::numeric,
  'country shape is the union of all estados');

-- 97's only inner border is the shared edge x = 0 (length 2), minus the 0.01
-- tolerance at each end where it meets the outer boundary.
select ok(
  (select extensions.st_length(border) between 1.97 and 1.99 from public.admin_area where code = '97'),
  'estado border keeps the shared edge and drops the coast');

-- Município: inner pieces are x = 0 (y 0..1) and y = 0 (x -1..0), each ~0.99.
select ok(
  (select extensions.st_length(border) between 1.96 and 1.99 from public.admin_area where code = '9700001'),
  'município border drops the pieces on the country boundary');

select is(
  (select extensions.geometrytype(border) from public.admin_area where code = '97'),
  'MULTILINESTRING',
  'borders are lines');

-- Points so that estado 97 "has points" for the município outline view.
insert into public.point (slug, title, summary, body, location, city, heritage, status) values
  ('teste-borda', '[TESTE]', '[TESTE]', '[TESTE]', 'SRID=4326;POINT(-0.5 0.5)', 'Teste', 'ambas', 'publicado');

set local role anon;

select isnt_empty($$select 1 from public.country_shape where geometry ? 'coordinates'$$,
  'anon can read the country shape');

select results_eq(
  $$select code from public.state_outline order by code$$,
  $$values ('96'::text), ('97'::text)$$,
  'state_outline lists estados with inner borders');

select results_eq(
  $$select code from public.municipality_outline$$,
  $$values ('9700001'::text)$$,
  'municipality_outline lists municípios of estados with published points');

select ok(
  (select bool_and(label->>'type' = 'Point') from public.state_outline),
  'outlines come with a label point for the name');

select * from finish();
rollback;
