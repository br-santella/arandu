// Map reveal rules (docs/03, docs/decisoes.md):
// - Brasil view: estado outlines; estados with points glow 0-100% in proportion
//   to discovered / published points;
// - estado view: all município outlines ("how many cities are left"); municípios
//   with points glow the same way; no roads;
// - município view: roads appear, the city outline stays highlighted, points lit or unlit;
// - a point discovered remotely is drawn as a ring, a visited one as a filled dot;
// - a later visit promotes remote -> presencial, never the opposite.

import type { LatLng } from '../../lib/geo';

export type DiscoveryMode = 'presencial' | 'remota';

export type MapPoint = LatLng & {
  id: string;
  slug: string;
  title: string;
  unlockRadiusM: number;
  stateCode: string | null;
  municipalityCode: string | null;
};

export type Discovery = { pointId: string; mode: DiscoveryMode };

export type AreaLevel = 'estado' | 'municipio';

export type Geometry = { type: string; coordinates: unknown };

/** An official area that contains published points (from the area_with_points view). */
export type AdminArea = {
  code: string;
  level: AreaLevel;
  name: string;
  /** Polygon, for the progress fill. */
  geometry: Geometry;
  /** Inner borders only (no coast), for the highlight line. */
  border: Geometry | null;
};

/** Inner borders (lines) of every estado, or of every município of estados with points. */
export type Outline = {
  code: string;
  name: string;
  geometry: Geometry;
  /** A point inside the area, where its name is written. */
  label: Geometry | null;
};

/** Name labels from IBGE outlines (replace the base style's place names). */
export function outlineLabelsGeoJSON(outlines: Outline[]) {
  return {
    type: 'FeatureCollection' as const,
    features: outlines
      .filter((o) => o.label)
      .map((o) => ({
        type: 'Feature' as const,
        properties: { code: o.code, name: o.name },
        geometry: o.label as Geometry,
      })),
  };
}

export function outlinesGeoJSON(outlines: Outline[]) {
  return {
    type: 'FeatureCollection' as const,
    features: outlines.map((o) => ({
      type: 'Feature' as const,
      properties: { code: o.code, name: o.name },
      geometry: o.geometry,
    })),
  };
}

/** Merge a new discovery into the list, applying the promotion rule. */
export function recordDiscovery(existing: Discovery[], next: Discovery): Discovery[] {
  const current = existing.find((d) => d.pointId === next.pointId);
  if (!current) return [...existing, next];
  if (current.mode === 'remota' && next.mode === 'presencial') {
    return existing.map((d) => (d.pointId === next.pointId ? next : d));
  }
  return existing; // already presencial, or same mode: nothing changes
}

export type AreaProgress = { discovered: number; total: number; ratio: number };

/**
 * discovered / published points per area code. Remote and presencial count the same.
 * Points without a code for the level (outside Brazil, areas not loaded) are skipped.
 */
export function areaProgress(
  points: MapPoint[],
  discoveries: Discovery[],
  level: AreaLevel,
): Map<string, AreaProgress> {
  const found = new Set(discoveries.map((d) => d.pointId));
  const areas = new Map<string, AreaProgress>();
  for (const p of points) {
    const code = level === 'estado' ? p.stateCode : p.municipalityCode;
    if (!code) continue;
    const a = areas.get(code) ?? { discovered: 0, total: 0, ratio: 0 };
    a.total += 1;
    if (found.has(p.id)) a.discovered += 1;
    a.ratio = a.discovered / a.total;
    areas.set(code, a);
  }
  return areas;
}

/** GeoJSON for one level, each area tagged with its progress (0 if unknown). */
export function areasGeoJSON(areas: AdminArea[], progress: Map<string, AreaProgress>, level: AreaLevel) {
  return {
    type: 'FeatureCollection' as const,
    features: areas
      .filter((a) => a.level === level)
      .map((a) => {
        const p = progress.get(a.code) ?? { discovered: 0, total: 0, ratio: 0 };
        return {
          type: 'Feature' as const,
          properties: { code: a.code, name: a.name, ...p },
          geometry: a.geometry,
        };
      }),
  };
}

/** Highlight lines (inner borders) for areas with points, tagged with progress. */
export function areaBordersGeoJSON(
  areas: AdminArea[],
  progress: Map<string, AreaProgress>,
  level: AreaLevel,
) {
  return {
    type: 'FeatureCollection' as const,
    features: areas
      .filter((a) => a.level === level && a.border)
      .map((a) => {
        const p = progress.get(a.code) ?? { discovered: 0, total: 0, ratio: 0 };
        return {
          type: 'Feature' as const,
          properties: { code: a.code, name: a.name, ...p },
          geometry: a.border as Geometry,
        };
      }),
  };
}

type Ring = number[][];

/**
 * A world-sized polygon with one hole per part of the country shape: everything
 * outside Brazil gets covered, so only Brazil is shown. Without the country
 * shape (still loading), there is no mask: covering the whole world would hide Brazil too.
 */
export function countryMaskGeoJSON(country: Geometry | null) {
  const empty = { type: 'FeatureCollection' as const, features: [] as unknown[] };
  const world: Ring = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];
  let holes: Ring[];
  if (country?.type === 'Polygon') {
    holes = [(country.coordinates as Ring[])[0]];
  } else if (country?.type === 'MultiPolygon') {
    holes = (country.coordinates as Ring[][]).map((polygon) => polygon[0]);
  } else {
    return empty;
  }
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'Polygon' as const, coordinates: [world, ...holes] },
      },
    ] as unknown[],
  };
}

/** GeoJSON for point markers: mode is 'apagado', 'remota' or 'presencial'. */
export function pointsGeoJSON(points: MapPoint[], discoveries: Discovery[]) {
  const modes = new Map(discoveries.map((d) => [d.pointId, d.mode]));
  return {
    type: 'FeatureCollection' as const,
    features: points.map((p) => ({
      type: 'Feature' as const,
      properties: { id: p.id, title: p.title, mode: modes.get(p.id) ?? 'apagado' },
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
    })),
  };
}

/** A dim veil over the whole map: the "unlit" Brazil. */
export const VEIL_GEOJSON = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
      ],
    ],
  },
};
