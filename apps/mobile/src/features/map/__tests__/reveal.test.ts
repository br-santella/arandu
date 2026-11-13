import { cellToChildren, cellToLatLng, cellToParent, latLngToCell } from 'h3-js';

import {
  type Discovery,
  type MapPoint,
  REVEAL_LEVELS,
  areaProgress,
  areaProgressGeoJSON,
  cellForPoint,
  fogGeoJSON,
  litCells,
  litCellsGeoJSON,
  pointsGeoJSON,
  recordDiscovery,
} from '../reveal';

// Fictitious test points: coordinates carry no historical meaning.
const p = (id: string, lat: number, lng: number): MapPoint => ({
  id,
  slug: `teste-${id}`,
  title: '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
  lat,
  lng,
  unlockRadiusM: 75,
});
const A = p('a', 0, 0);
const A2 = p('a2', 0.0001, 0.0001); // same res-9 cell as A
const B = p('b', 1, 1);

describe('recordDiscovery', () => {
  it('adds a new discovery', () => {
    expect(recordDiscovery([], { pointId: 'a', mode: 'remota' })).toEqual([
      { pointId: 'a', mode: 'remota' },
    ]);
  });

  it('promotes remote to presencial after a visit', () => {
    const out = recordDiscovery([{ pointId: 'a', mode: 'remota' }], { pointId: 'a', mode: 'presencial' });
    expect(out).toEqual([{ pointId: 'a', mode: 'presencial' }]);
  });

  it('never demotes presencial to remote', () => {
    const existing: Discovery[] = [{ pointId: 'a', mode: 'presencial' }];
    expect(recordDiscovery(existing, { pointId: 'a', mode: 'remota' })).toBe(existing);
  });
});

describe('litCells', () => {
  it('lights the cell of each discovered point', () => {
    const cells = litCells([A, B], [{ pointId: 'a', mode: 'remota' }]);
    expect([...cells]).toEqual([[cellForPoint(A), 'remota']]);
  });

  it('gives presencial priority when points share a cell', () => {
    expect(cellForPoint(A)).toBe(cellForPoint(A2));
    const cells = litCells(
      [A, A2],
      [
        { pointId: 'a', mode: 'presencial' },
        { pointId: 'a2', mode: 'remota' },
      ],
    );
    expect(cells.get(cellForPoint(A))).toBe('presencial');
  });

  it('ignores discoveries of points that are no longer published', () => {
    expect(litCells([B], [{ pointId: 'a', mode: 'remota' }]).size).toBe(0);
  });
});

describe('GeoJSON builders', () => {
  const cells = litCells([A, B], [
    { pointId: 'a', mode: 'presencial' },
    { pointId: 'b', mode: 'remota' },
  ]);

  it('builds closed hexagon rings tagged with the mode', () => {
    const fc = litCellsGeoJSON(cells);
    expect(fc.features).toHaveLength(2);
    const ring = fc.features[0].geometry.coordinates[0];
    expect(ring).toHaveLength(7); // 6 vertices + closing point
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(fc.features.map((f) => f.properties.mode).sort()).toEqual(['presencial', 'remota']);
  });

  it('cuts one hole in the fog per lit cell', () => {
    expect(fogGeoJSON(cells).geometry.coordinates).toHaveLength(1 + 2);
    expect(fogGeoJSON(new Map()).geometry.coordinates).toHaveLength(1);
  });

  it('marks undiscovered points as apagado', () => {
    const fc = pointsGeoJSON([A, B], [{ pointId: 'a', mode: 'remota' }]);
    expect(fc.features.map((f) => f.properties.mode)).toEqual(['remota', 'apagado']);
  });
});

describe('areaProgress (hierarchical reveal)', () => {
  // Three points inside the same bairro-level cell (built from its children,
  // so the test never depends on where cell borders fall) and one far away.
  const bairro = latLngToCell(0, 0, 7);
  const [near1, near2, near3] = cellToChildren(bairro, 9)
    .slice(0, 3)
    .map((cell, i) => {
      const [lat, lng] = cellToLatLng(cell);
      return p(`n${i + 1}`, lat, lng);
    });
  const far = p('f', 10, 10);
  const all = [near1, near2, near3, far];

  it('computes discovered / total per area', () => {
    const prog = areaProgress(all, [{ pointId: 'n1', mode: 'remota' }], 7);
    const nearArea = prog.get(cellToParent(cellForPoint(near1), 7));
    expect(nearArea).toEqual({ discovered: 1, total: 3, ratio: 1 / 3 });
  });

  it('lists areas with nothing discovered yet (ratio 0), so goals are visible', () => {
    const prog = areaProgress(all, [{ pointId: 'n1', mode: 'remota' }], 7);
    const farArea = prog.get(cellToParent(cellForPoint(far), 7));
    expect(farArea).toEqual({ discovered: 0, total: 1, ratio: 0 });
  });

  it('counts remote and presencial the same', () => {
    const remote = areaProgress(all, [{ pointId: 'n1', mode: 'remota' }], 4);
    const visit = areaProgress(all, [{ pointId: 'n1', mode: 'presencial' }], 4);
    expect([...remote]).toEqual([...visit]);
  });

  it('larger levels aggregate more points', () => {
    for (const level of REVEAL_LEVELS) {
      const prog = areaProgress(all, [], level.resolution);
      const total = [...prog.values()].reduce((sum, a) => sum + a.total, 0);
      expect(total).toBe(all.length); // every point belongs to exactly one area
    }
  });

  it('reaches ratio 1 when every point of the area is discovered', () => {
    const ds: Discovery[] = ['n1', 'n2', 'n3'].map((id) => ({ pointId: id, mode: 'remota' }));
    const prog = areaProgress(all, ds, 7);
    expect(prog.get(cellToParent(cellForPoint(near1), 7))?.ratio).toBe(1);
  });

  it('builds closed polygons with level and progress', () => {
    const fc = areaProgressGeoJSON(areaProgress(all, [], 7), 'bairro');
    expect(fc.features.length).toBeGreaterThan(0);
    const f = fc.features[0];
    expect(f.properties.level).toBe('bairro');
    const ring = f.geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});
