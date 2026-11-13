import {
  type AdminArea,
  type Discovery,
  type MapPoint,
  areaProgress,
  areasGeoJSON,
  pointsGeoJSON,
  recordDiscovery,
} from '../reveal';

// Fictitious test points and area codes: no historical or geographic meaning.
const p = (id: string, stateCode: string | null, municipalityCode: string | null): MapPoint => ({
  id,
  slug: `teste-${id}`,
  title: '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
  lat: 0,
  lng: 0,
  unlockRadiusM: 75,
  stateCode,
  municipalityCode,
});

// Estado 99 has municípios 9900001 (2 points) and 9900002 (1 point); estado 98 has 1 point.
const points = [
  p('a', '99', '9900001'),
  p('b', '99', '9900001'),
  p('c', '99', '9900002'),
  p('d', '98', '9800001'),
  p('x', null, null), // outside all areas
];

const remote = (id: string): Discovery => ({ pointId: id, mode: 'remota' });

describe('recordDiscovery', () => {
  it('adds a new discovery', () => {
    expect(recordDiscovery([], remote('a'))).toEqual([remote('a')]);
  });

  it('promotes remote to presencial after a visit', () => {
    const out = recordDiscovery([remote('a')], { pointId: 'a', mode: 'presencial' });
    expect(out).toEqual([{ pointId: 'a', mode: 'presencial' }]);
  });

  it('never demotes presencial to remote', () => {
    const existing: Discovery[] = [{ pointId: 'a', mode: 'presencial' }];
    expect(recordDiscovery(existing, remote('a'))).toBe(existing);
  });
});

describe('areaProgress', () => {
  it('computes the share of discovered points per estado', () => {
    const prog = areaProgress(points, [remote('a')], 'estado');
    expect(prog.get('99')).toEqual({ discovered: 1, total: 3, ratio: 1 / 3 });
    expect(prog.get('98')).toEqual({ discovered: 0, total: 1, ratio: 0 });
  });

  it('computes the share per município independently', () => {
    const prog = areaProgress(points, [remote('a'), remote('b')], 'municipio');
    expect(prog.get('9900001')?.ratio).toBe(1);
    expect(prog.get('9900002')?.ratio).toBe(0);
  });

  it('counts remote and presencial the same', () => {
    const r = areaProgress(points, [remote('a')], 'estado');
    const v = areaProgress(points, [{ pointId: 'a', mode: 'presencial' }], 'estado');
    expect([...r]).toEqual([...v]);
  });

  it('ignores points without an area code', () => {
    const prog = areaProgress(points, [remote('x')], 'estado');
    const total = [...prog.values()].reduce((s, a) => s + a.total, 0);
    expect(total).toBe(4);
  });

  it('ignores discoveries of points that are no longer published', () => {
    expect(areaProgress(points, [remote('gone')], 'estado').get('99')?.discovered).toBe(0);
  });
});

describe('areasGeoJSON', () => {
  const square = { type: 'Polygon' as const, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] };
  const areas: AdminArea[] = [
    { code: '99', level: 'estado', name: '[TESTE] Estado', geometry: square },
    { code: '9900001', level: 'municipio', name: '[TESTE] Município', geometry: square },
  ];

  it('keeps only the requested level and attaches progress', () => {
    const fc = areasGeoJSON(areas, areaProgress(points, [remote('a')], 'estado'), 'estado');
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].properties).toMatchObject({ code: '99', discovered: 1, total: 3 });
    expect(fc.features[0].geometry).toBe(square);
  });

  it('defaults to 0% for areas without progress data', () => {
    const fc = areasGeoJSON(areas, new Map(), 'municipio');
    expect(fc.features[0].properties.ratio).toBe(0);
  });
});

describe('pointsGeoJSON', () => {
  it('marks each point as apagado, remota or presencial', () => {
    const fc = pointsGeoJSON(points.slice(0, 3), [remote('a'), { pointId: 'b', mode: 'presencial' }]);
    expect(fc.features.map((f) => f.properties.mode)).toEqual(['remota', 'presencial', 'apagado']);
  });
});
