"""Load official IBGE boundaries (estados and municípios) into public.admin_area.

Source: IBGE "malhas" API v3 (geometries) and "localidades" API v1 (names).
Public data; attribution "IBGE" is shown on the map.

Usage:
    uv run python -m arandu_pipeline.ibge_areas                 # local database
    DATABASE_URL=... uv run python -m arandu_pipeline.ibge_areas  # another database

Idempotent: re-running updates existing rows. Afterwards it recomputes the
estado/município codes of every point (refresh_point_admin_codes()).
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass

import httpx

MALHAS = "https://servicodados.ibge.gov.br/api/v3/malhas"
LOCALIDADES = "https://servicodados.ibge.gov.br/api/v1/localidades"
GEOJSON = "application/vnd.geo+json"
LOCAL_DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"


@dataclass(frozen=True)
class AreaRow:
    code: str
    level: str  # 'estado' | 'municipio'
    name: str
    state_code: str | None
    geometry: str  # GeoJSON geometry, as text


def build_rows(feature_collection: dict, names: dict[str, str], level: str) -> list[AreaRow]:
    """Turn an IBGE GeoJSON FeatureCollection into rows. Fails on unknown codes."""
    rows: list[AreaRow] = []
    for feature in feature_collection["features"]:
        code = str(feature["properties"]["codarea"])
        if code not in names:
            raise ValueError(f"no name for IBGE code {code}")
        rows.append(
            AreaRow(
                code=code,
                level=level,
                name=names[code],
                state_code=code[:2] if level == "municipio" else None,
                geometry=json.dumps(feature["geometry"]),
            )
        )
    return rows


def fetch_rows(http: httpx.Client) -> list[AreaRow]:
    params = {"formato": GEOJSON, "qualidade": "minima"}

    def get(url: str, **extra) -> object:
        response = http.get(url, params={**params, **extra} if "malhas" in url else None)
        response.raise_for_status()
        return response.json()

    state_names = {str(s["id"]): s["nome"] for s in get(f"{LOCALIDADES}/estados")}
    city_names = {str(m["id"]): m["nome"] for m in get(f"{LOCALIDADES}/municipios")}
    states = get(f"{MALHAS}/paises/BR", intrarregiao="UF")
    cities = get(f"{MALHAS}/paises/BR", intrarregiao="municipio")
    return build_rows(states, state_names, "estado") + build_rows(cities, city_names, "municipio")


UPSERT = """
insert into public.admin_area (code, level, name, state_code, geom, updated_at)
values (
  %(code)s, %(level)s, %(name)s, %(state_code)s,
  extensions.st_multi(extensions.st_collectionextract(extensions.st_makevalid(
    extensions.st_setsrid(extensions.st_geomfromgeojson(%(geometry)s), 4326)), 3)),
  now()
)
on conflict (code) do update set
  level = excluded.level, name = excluded.name, state_code = excluded.state_code,
  geom = excluded.geom, updated_at = now()
"""


def load(rows: list[AreaRow], database_url: str) -> int:
    import psycopg  # imported here so unit tests do not need a database driver

    with psycopg.connect(database_url) as conn, conn.cursor() as cur:
        cur.executemany(UPSERT, [row.__dict__ for row in rows])
        cur.execute("select public.refresh_point_admin_codes()")
        return cur.fetchone()[0]


def main() -> None:
    database_url = os.environ.get("DATABASE_URL") or LOCAL_DB
    with httpx.Client(timeout=120) as http:
        rows = fetch_rows(http)
    states = sum(r.level == "estado" for r in rows)
    print(f"IBGE: {states} estados, {len(rows) - states} municípios", file=sys.stderr)
    changed = load(rows, database_url)
    print(f"admin_area updated; {changed} point(s) got new codes", file=sys.stderr)


if __name__ == "__main__":
    main()
