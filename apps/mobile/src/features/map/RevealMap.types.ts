import type { AdminArea, Discovery, Geometry, MapPoint, Outline } from './reveal';

export type RevealMapProps = {
  points: MapPoint[];
  areas: AdminArea[];
  stateOutlines: Outline[];
  municipalityOutlines: Outline[];
  country: Geometry | null;
  discoveries: Discovery[];
  onPointPress: (pointId: string) => void;
  /** When set, the map flies to this point (e.g. the open card's point). */
  focus?: { lat: number; lng: number } | null;
};
