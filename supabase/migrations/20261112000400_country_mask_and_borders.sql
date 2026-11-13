-- Map polish (docs/decisoes.md):
-- - show only Brazil: the app masks everything outside the country shape;
-- - no coastline strokes: estado and município lines are their borders minus the
--   country's outer boundary (coast and international borders). The coast reads
--   from the land/water contrast.
-- Derived data is computed once, after importing the IBGE areas
-- (refresh_admin_derived(), called by pipeline/arandu_pipeline/ibge_areas.py).

alter table public.admin_area drop constraint admin_area_level_check;
alter table public.admin_area drop constraint admin_area_check;
alter table public.admin_area add constraint admin_area_level_check
  check (level in ('pais', 'estado', 'municipio'));
alter table public.admin_area add constraint admin_area_code_check check (
  (level = 'pais' and code = 'BR')
  or (level = 'estado' and length(code) = 2)
  or (level = 'municipio' and length(code) = 7)
);

-- Inner borders only (no coast, no international border). Null for 'pais'.
alter table public.admin_area add column border extensions.geometry(multilinestring, 4326);

-- Tolerance (degrees, ~1 km) to drop line pieces that run along the country's
-- outer boundary. IBGE estado and município meshes are simplified independently,
-- so their coasts differ slightly; a small band absorbs that.
create function public.refresh_admin_derived(tolerance double precision default 0.01)
returns void
language plpgsql set search_path = '' as $$
declare
  outer_band extensions.geometry;
begin
  delete from public.admin_area where level = 'pais';
  insert into public.admin_area (code, level, name, geom)
  select 'BR', 'pais', 'Brasil',
         extensions.st_multi(extensions.st_collectionextract(
           extensions.st_makevalid(extensions.st_union(a.geom)), 3))
  from public.admin_area a
  where a.level = 'estado'
  having count(*) > 0;

  select extensions.st_buffer(extensions.st_boundary(geom), tolerance)
    into outer_band
  from public.admin_area where level = 'pais';

  update public.admin_area a
  set border = case
    when outer_band is null then null
    else extensions.st_multi(extensions.st_collectionextract(
      extensions.st_difference(extensions.st_boundary(a.geom), outer_band), 2))
  end
  where a.level in ('estado', 'municipio');
end;
$$;
revoke execute on function public.refresh_admin_derived(double precision) from public, anon, authenticated;

-- Country shape, for the mask that hides other countries.
create view public.country_shape with (security_invoker = true) as
select extensions.st_asgeojson(a.geom, 4)::jsonb as geometry
from public.admin_area a
where a.level = 'pais';

-- Outline views now return inner borders (lines) instead of polygons.
drop view public.state_outline;
-- `label`: a point inside the area, where the app writes its name (the base
-- style's place names would include neighbouring countries' provinces).
create view public.state_outline with (security_invoker = true) as
select a.code, a.name, extensions.st_asgeojson(a.border, 4)::jsonb as geometry,
       extensions.st_asgeojson(extensions.st_pointonsurface(a.geom), 4)::jsonb as label
from public.admin_area a
where a.level = 'estado' and a.border is not null and not extensions.st_isempty(a.border);

drop view public.municipality_outline;
create view public.municipality_outline with (security_invoker = true) as
select a.code, a.name, a.state_code, extensions.st_asgeojson(a.border, 4)::jsonb as geometry,
       extensions.st_asgeojson(extensions.st_pointonsurface(a.geom), 4)::jsonb as label
from public.admin_area a
where a.level = 'municipio'
  and a.border is not null and not extensions.st_isempty(a.border)
  and a.state_code in (
    select p.state_code
    from public.point p
    where p.status = 'publicado' and p.sensitivity <> 'restrito' and p.state_code is not null
  );

-- Areas with points: polygon for the progress fill, border for the highlight.
drop view public.area_with_points;
create view public.area_with_points with (security_invoker = true) as
select
  a.code,
  a.level,
  a.name,
  a.state_code,
  count(p.id)::int as total_points,
  extensions.st_asgeojson(a.geom, 5)::jsonb as geometry,
  extensions.st_asgeojson(a.border, 5)::jsonb as border
from public.admin_area a
join public.point p
  on (a.level = 'estado' and p.state_code = a.code)
  or (a.level = 'municipio' and p.municipality_code = a.code)
where p.status = 'publicado' and p.sensitivity <> 'restrito'
group by a.code;

grant select on public.country_shape, public.state_outline, public.municipality_outline,
  public.area_with_points to anon, authenticated;
