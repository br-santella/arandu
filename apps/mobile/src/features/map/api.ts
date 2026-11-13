// Reads the map data from Supabase: published points and the official areas
// (IBGE) that contain them. Both views apply RLS and the published filter.
import { supabase } from '../../lib/supabase';
import type { AdminArea, MapPoint } from './reveal';

export type PublishedPointRow = {
  id: string;
  slug: string;
  title: string;
  lat: number;
  lng: number;
  unlock_radius_m: number;
  state_code: string | null;
  municipality_code: string | null;
};

export type AreaRow = {
  code: string;
  level: AdminArea['level'];
  name: string;
  geometry: AdminArea['geometry'];
};

export function toMapPoint(row: PublishedPointRow): MapPoint {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    lat: row.lat,
    lng: row.lng,
    unlockRadiusM: row.unlock_radius_m,
    stateCode: row.state_code,
    municipalityCode: row.municipality_code,
  };
}

export type MapData = { points: MapPoint[]; areas: AdminArea[] };

export async function fetchMapData(): Promise<MapData> {
  const [points, areas] = await Promise.all([
    supabase
      .from('published_point')
      .select('id, slug, title, lat, lng, unlock_radius_m, state_code, municipality_code')
      .order('title'),
    supabase.from('area_with_points').select('code, level, name, geometry'),
  ]);
  if (points.error) throw points.error;
  if (areas.error) throw areas.error;
  return {
    points: (points.data as PublishedPointRow[]).map(toMapPoint),
    areas: areas.data as AreaRow[],
  };
}
