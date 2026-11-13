-- Official administrative areas (IBGE) for the map's progress by state and city,
-- and for future aggregated reports (docs/decisoes.md).
-- Geometries come from the IBGE "malhas" API (public data), loaded by
-- pipeline/arandu_pipeline/ibge_areas.py; never edited by hand.

create table public.admin_area (
  code text primary key,                 -- IBGE code: 2 digits (estado) or 7 (município)
  level text not null check (level in ('estado', 'municipio')),
  name text not null,
  state_code text,                       -- for municípios: the parent estado code
  geom extensions.geometry(multipolygon, 4326) not null,
  source text not null default 'IBGE, API de malhas v3',
  updated_at timestamptz not null default now(),
  check ((level = 'estado' and length(code) = 2) or (level = 'municipio' and length(code) = 7))
);
create index admin_area_geom_idx on public.admin_area using gist (geom);
create index admin_area_level_idx on public.admin_area (level);

-- Which estado and município each point is in (filled automatically).
alter table public.point
  add column state_code text,
  add column municipality_code text;
create index point_state_code_idx on public.point (state_code);
create index point_municipality_code_idx on public.point (municipality_code);

-- Point-in-polygon lookup. Returns null when no area covers the point
-- (e.g. areas not loaded yet; see refresh_point_admin_codes()).
create function public.admin_area_code_for(loc extensions.geography, area_level text)
returns text
language sql stable set search_path = '' as $$
  select a.code
  from public.admin_area a
  where a.level = area_level
    and extensions.st_covers(a.geom, loc::extensions.geometry)
  limit 1;
$$;

create function public.point_assign_admin_area() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.state_code := public.admin_area_code_for(new.location, 'estado');
  new.municipality_code := public.admin_area_code_for(new.location, 'municipio');
  return new;
end;
$$;
create trigger point_assign_admin_area
  before insert or update of location on public.point
  for each row execute function public.point_assign_admin_area();

-- Recompute codes for all points (run after loading or updating admin areas).
create function public.refresh_point_admin_codes() returns integer
language plpgsql set search_path = '' as $$
declare
  changed integer;
begin
  update public.point p
  set state_code = public.admin_area_code_for(p.location, 'estado'),
      municipality_code = public.admin_area_code_for(p.location, 'municipio')
  where p.state_code is distinct from public.admin_area_code_for(p.location, 'estado')
     or p.municipality_code is distinct from public.admin_area_code_for(p.location, 'municipio');
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke execute on function public.refresh_point_admin_codes() from public, anon, authenticated;

-- Public data: anyone can read; only the service role writes.
alter table public.admin_area enable row level security;
create policy admin_area_public_read on public.admin_area
  for select to anon, authenticated using (true);

-- Areas that contain published points, with totals and a GeoJSON geometry.
-- The app downloads only these, never the whole country.
-- security_invoker: point rows are filtered by the caller's RLS; the explicit
-- status/sensitivity filter keeps totals identical for curators and students.
create view public.area_with_points with (security_invoker = true) as
select
  a.code,
  a.level,
  a.name,
  a.state_code,
  count(p.id)::int as total_points,
  extensions.st_asgeojson(a.geom, 5)::jsonb as geometry
from public.admin_area a
join public.point p
  on (a.level = 'estado' and p.state_code = a.code)
  or (a.level = 'municipio' and p.municipality_code = a.code)
where p.status = 'publicado' and p.sensitivity <> 'restrito'
group by a.code;

grant select on public.area_with_points to anon, authenticated;

-- Published points in an app-friendly shape (lat/lng numbers instead of PostGIS).
-- security_invoker: the caller's RLS applies; the explicit filter keeps the
-- result identical for curators and students.
create view public.published_point with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.title,
  p.summary,
  extensions.st_y(p.location::extensions.geometry) as lat,
  extensions.st_x(p.location::extensions.geometry) as lng,
  p.unlock_radius_m,
  p.city,
  p.neighborhood,
  p.heritage,
  p.state_code,
  p.municipality_code
from public.point p
where p.status = 'publicado' and p.sensitivity <> 'restrito';

grant select on public.published_point to anon, authenticated;
