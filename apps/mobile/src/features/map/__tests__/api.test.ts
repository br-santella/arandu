// The Supabase client needs env vars at import time; the mapping is pure.
import { PAGE_SIZE, fetchAllPages, toMapPoint } from '../api';

jest.mock('../../../lib/supabase', () => ({ supabase: {} }));

describe('toMapPoint', () => {
  it('maps a published_point row to the app model', () => {
    expect(
      toMapPoint({
        id: 'id-1',
        slug: 'teste-1',
        title: '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
        lat: -1.5,
        lng: 2.5,
        unlock_radius_m: 75,
        state_code: '99',
        municipality_code: null,
      }),
    ).toEqual({
      id: 'id-1',
      slug: 'teste-1',
      title: '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
      lat: -1.5,
      lng: 2.5,
      unlockRadiusM: 75,
      stateCode: '99',
      municipalityCode: null,
    });
  });
});

describe('fetchAllPages', () => {
  it('reads until a page comes back short', async () => {
    const total = PAGE_SIZE * 2 + 5;
    const ranges: [number, number][] = [];
    const rows = await fetchAllPages<number>(async (from, to) => {
      ranges.push([from, to]);
      const data = Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => from + i);
      return { data, error: null };
    });
    expect(rows).toHaveLength(total);
    expect(ranges).toEqual([
      [0, PAGE_SIZE - 1],
      [PAGE_SIZE, 2 * PAGE_SIZE - 1],
      [2 * PAGE_SIZE, 3 * PAGE_SIZE - 1],
    ]);
  });

  it('propagates errors', async () => {
    await expect(fetchAllPages(async () => ({ data: null, error: new Error('boom') }))).rejects.toThrow('boom');
  });
});
