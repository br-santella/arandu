// The Supabase client needs env vars at import time; the mapping is pure.
import { toMapPoint } from '../api';

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
