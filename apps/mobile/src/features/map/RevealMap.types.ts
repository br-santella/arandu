import type { Discovery, MapPoint } from './reveal';

export type RevealMapProps = {
  points: MapPoint[];
  discoveries: Discovery[];
  onPointPress: (pointId: string) => void;
  /** When set, the map flies to this point (e.g. the open card's point). */
  focus?: { lat: number; lng: number } | null;
};
