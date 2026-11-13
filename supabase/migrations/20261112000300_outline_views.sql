-- Outlines for the map's level-of-detail progression (docs/decisoes.md):
-- - Brazil view: every estado outline;
-- - estado view: every município outline of the estados that have published
--   points, so people can see "how many cities are left".
-- GeoJSON with 4 decimals (~11 m), enough for these zooms.

create view public.state_outline with (security_invoker = true) as
select a.code, a.name, extensions.st_asgeojson(a.geom, 4)::jsonb as geometry
from public.admin_area a
where a.level = 'estado';

create view public.municipality_outline with (security_invoker = true) as
select a.code, a.name, a.state_code, extensions.st_asgeojson(a.geom, 4)::jsonb as geometry
from public.admin_area a
where a.level = 'municipio'
  and a.state_code in (
    select p.state_code
    from public.point p
    where p.status = 'publicado' and p.sensitivity <> 'restrito' and p.state_code is not null
  );

grant select on public.state_outline, public.municipality_outline to anon, authenticated;
