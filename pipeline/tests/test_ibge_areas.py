import json

import httpx
import pytest

from arandu_pipeline.ibge_areas import build_rows, fetch_rows

SQUARE = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}


def fc(*codes):
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "properties": {"codarea": c}, "geometry": SQUARE} for c in codes
        ],
    }


def test_build_rows_for_states():
    rows = build_rows(fc("99"), {"99": "[TESTE] Estado"}, "estado")
    assert len(rows) == 1
    assert rows[0].code == "99"
    assert rows[0].state_code is None
    assert json.loads(rows[0].geometry) == SQUARE


def test_build_rows_for_municipios_derives_state_code():
    rows = build_rows(fc("9900001"), {"9900001": "[TESTE] Município"}, "municipio")
    assert rows[0].state_code == "99"


def test_build_rows_rejects_codes_without_name():
    with pytest.raises(ValueError, match="9900002"):
        build_rows(fc("9900002"), {}, "municipio")


def test_fetch_rows_calls_ibge_apis():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(str(request.url))
        path = request.url.path
        if path.endswith("/localidades/estados"):
            return httpx.Response(200, json=[{"id": 99, "nome": "[TESTE] Estado"}])
        if path.endswith("/localidades/municipios"):
            return httpx.Response(200, json=[{"id": 9900001, "nome": "[TESTE] Município"}])
        level = request.url.params["intrarregiao"]
        assert request.url.params["qualidade"] == "minima"
        return httpx.Response(200, json=fc("99") if level == "UF" else fc("9900001"))

    rows = fetch_rows(httpx.Client(transport=httpx.MockTransport(handler)))
    assert [(r.code, r.level) for r in rows] == [("99", "estado"), ("9900001", "municipio")]
    assert len(seen) == 4
