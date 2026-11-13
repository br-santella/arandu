// Geographic helpers. Runs on the device only: user positions never leave it.

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_008.8; // mean Earth radius (IUGG)

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in meters (haversine formula). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True when `user` is within `radiusM` meters of `target` (inclusive). */
export function isWithinRadius(user: LatLng, target: LatLng, radiusM: number): boolean {
  return haversineMeters(user, target) <= radiusM;
}
