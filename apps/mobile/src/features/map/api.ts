// Reads the map data from Supabase: published points and the official areas
// (IBGE) that contain them. Both views apply RLS and the published filter.
import { supabase } from '../../lib/supabase';
import type { AdminArea, Geometry, MapPoint, Outline } from './reveal';

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

export type AreaRow = AdminArea;

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

export type MapData = {
  points: MapPoint[];
  areas: AdminArea[];
  stateOutlines: Outline[];
  municipalityOutlines: Outline[];
  /** Brazil (union of estados), for the mask that hides other countries. */
  country: Geometry | null;
};

/** The API returns at most 1000 rows per request; read page by page. */
export const PAGE_SIZE = 1000;

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function fetchMapData(): Promise<MapData> {
  const [points, areas, stateOutlines, municipalityOutlines, country] = await Promise.all([
    fetchAllPages<PublishedPointRow>((from, to) =>
      supabase
        .from('published_point')
        .select('id, slug, title, lat, lng, unlock_radius_m, state_code, municipality_code')
        .order('title')
        .range(from, to),
    ),
    fetchAllPages<AreaRow>((from, to) =>
      supabase
        .from('area_with_points')
        .select('code, level, name, geometry, border')
        .order('code')
        .range(from, to),
    ),
    fetchAllPages<Outline>((from, to) =>
      supabase.from('state_outline').select('code, name, geometry, label').order('code').range(from, to),
    ),
    fetchAllPages<Outline>((from, to) =>
      supabase
        .from('municipality_outline')
        .select('code, name, geometry, label')
        .order('code')
        .range(from, to),
    ),
    fetchAllPages<{ geometry: Geometry }>((from, to) =>
      supabase.from('country_shape').select('geometry').range(from, to),
    ),
  ]);
  return {
    points: points.map(toMapPoint),
    areas,
    stateOutlines,
    municipalityOutlines,
    country: country[0]?.geometry ?? null,
  };
}
