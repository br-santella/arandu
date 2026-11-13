// Map reveal rules (docs/03, docs/decisoes.md):
// - each discovered point lights the H3 cell that contains it;
// - presencial discoveries are filled, remote ones are outlined;
// - a later visit promotes remote -> presencial, never the opposite.

import { cellToBoundary, latLngToCell } from 'h3-js';

import type { LatLng } from '../../lib/geo';

export const REVEAL_RESOLUTION = 9; // ~0.1 km² per cell

export type DiscoveryMode = 'presencial' | 'remota';

export type MapPoint = LatLng & {
  id: string;
  slug: string;
  title: string;
  unlockRadiusM: number;
};

export type Discovery = { pointId: string; mode: DiscoveryMode };

export function cellForPoint(point: LatLng): string {
  return latLngToCell(point.lat, point.lng, REVEAL_RESOLUTION);
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

/** Lit cells and their mode. If several points share a cell, presencial wins. */
export function litCells(points: MapPoint[], discoveries: Discovery[]): Map<string, DiscoveryMode> {
  const byId = new Map(points.map((p) => [p.id, p]));
  const cells = new Map<string, DiscoveryMode>();
  for (const d of discoveries) {
    const point = byId.get(d.pointId);
    if (!point) continue; // e.g. point was unpublished since the discovery
    const cell = cellForPoint(point);
    if (cells.get(cell) !== 'presencial') cells.set(cell, d.mode);
  }
  return cells;
}

type Ring = [number, number][];

function cellRing(cell: string): Ring {
  // GeoJSON format: [lng, lat], ring already closed by h3-js.
  const ring = cellToBoundary(cell, true) as Ring;
  const [first, last] = [ring[0], ring[ring.length - 1]];
  const closed = first[0] === last[0] && first[1] === last[1];
  return closed ? ring : [...ring, first];
}

/** GeoJSON with one polygon per lit cell, tagged with its mode. */
export function litCellsGeoJSON(cells: Map<string, DiscoveryMode>) {
  return {
    type: 'FeatureCollection' as const,
    features: [...cells].map(([cell, mode]) => ({
      type: 'Feature' as const,
      properties: { cell, mode },
      geometry: { type: 'Polygon' as const, coordinates: [cellRing(cell)] },
    })),
  };
}

const WORLD_RING: Ring = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

/** Dark "fog" over the world with a hole for every lit cell. */
export function fogGeoJSON(cells: Map<string, DiscoveryMode>) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [WORLD_RING, ...[...cells.keys()].map((c) => cellRing(c).reverse())],
    },
  };
}

/** GeoJSON for point markers, with a discovered flag for styling. */
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
