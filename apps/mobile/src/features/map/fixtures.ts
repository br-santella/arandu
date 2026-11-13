// DEV-ONLY test points until the app reads published points from Supabase (M2, step 2.4).
// Fictitious content and arbitrary coordinates: they carry no historical meaning.
import type { MapPoint } from './reveal';

const TEST = '[CONTEÚDO DE TESTE — NÃO PUBLICAR]';

export const TEST_POINTS: MapPoint[] = [
  { id: 't1', slug: 'teste-1', title: `${TEST} Ponto 1`, lat: -23.5578, lng: -46.6355, unlockRadiusM: 75 },
  { id: 't2', slug: 'teste-2', title: `${TEST} Ponto 2`, lat: -23.5612, lng: -46.6312, unlockRadiusM: 75 },
  { id: 't3', slug: 'teste-3', title: `${TEST} Ponto 3`, lat: -23.5665, lng: -46.6930, unlockRadiusM: 75 },
  { id: 't4', slug: 'teste-4', title: `${TEST} Ponto 4`, lat: -15.7939, lng: -47.8828, unlockRadiusM: 75 },
];
