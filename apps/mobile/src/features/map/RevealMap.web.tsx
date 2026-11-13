// Web map (maplibre-gl). The native version comes after web is validated.
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  type GeoJSONSource,
  Map as MapLibreMap,
  type MapLayerMouseEvent,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';

import { colors, palette } from '../../theme/colors';
import { fogGeoJSON, litCells, litCellsGeoJSON, pointsGeoJSON } from './reveal';
import type { RevealMapProps } from './RevealMap.types';

// Worker file copied to public/ by scripts/copy-maplibre-worker.mjs.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/dark';

// Brazil, roughly: [west, south, east, north]
const BRAZIL_BOUNDS: [number, number, number, number] = [-74, -34, -34, 5.5];

export function RevealMap({ points, discoveries, onPointPress, focus }: RevealMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const onPress = useRef(onPointPress);
  useEffect(() => {
    onPress.current = onPointPress;
  }, [onPointPress]);

  const data = useMemo(() => {
    const cells = litCells(points, discoveries);
    return {
      fog: fogGeoJSON(cells),
      cells: litCellsGeoJSON(cells),
      points: pointsGeoJSON(points, discoveries),
    };
  }, [points, discoveries]);
  const latest = useRef(data);

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    const m = new MapLibreMap({
      container: container.current,
      style: STYLE_URL,
      bounds: BRAZIL_BOUNDS,
      attributionControl: { compact: true },
    });
    map.current = m;
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    m.on('load', () => {
      // Prefer Portuguese place names when the tiles provide them.
      for (const layer of m.getStyle().layers) {
        if (layer.type === 'symbol' && m.getLayoutProperty(layer.id, 'text-field')) {
          m.setLayoutProperty(layer.id, 'text-field', [
            'coalesce',
            ['get', 'name:pt'],
            ['get', 'name'],
          ]);
        }
      }

      m.addSource('fog', { type: 'geojson', data: latest.current.fog });
      m.addSource('cells', { type: 'geojson', data: latest.current.cells });
      m.addSource('points', { type: 'geojson', data: latest.current.points });

      m.addLayer({
        id: 'fog',
        type: 'fill',
        source: 'fog',
        // Fog darker than the base map, so revealed cells read as brighter ("lit").
        paint: { 'fill-color': '#05080A', 'fill-opacity': 0.8 },
      });
      m.addLayer({
        id: 'cells-fill',
        type: 'fill',
        source: 'cells',
        filter: ['==', ['get', 'mode'], 'presencial'],
        paint: { 'fill-color': palette.ochre, 'fill-opacity': 0.22 },
      });
      m.addLayer({
        id: 'cells-outline',
        type: 'line',
        source: 'cells',
        paint: { 'line-color': palette.ochre, 'line-width': 2 },
      });
      m.addLayer({
        id: 'points-glow',
        type: 'circle',
        source: 'points',
        filter: ['!=', ['get', 'mode'], 'apagado'],
        paint: { 'circle-radius': 14, 'circle-color': palette.ochre, 'circle-opacity': 0.25, 'circle-blur': 0.8 },
      });
      m.addLayer({
        id: 'points',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 7,
          'circle-color': ['match', ['get', 'mode'], 'apagado', colors.textMuted, palette.ochre],
          'circle-opacity': ['match', ['get', 'mode'], 'apagado', 0.55, 1],
          'circle-stroke-color': palette.dark,
          'circle-stroke-width': 1.5,
        },
      });

      m.on('click', 'points', (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === 'string') onPress.current(id);
      });
      m.on('mouseenter', 'points', () => (m.getCanvas().style.cursor = 'pointer'));
      m.on('mouseleave', 'points', () => (m.getCanvas().style.cursor = ''));
    });

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Update data when discoveries change.
  useEffect(() => {
    latest.current = data;
    const m = map.current;
    if (!m || !m.isStyleLoaded()) return;
    (m.getSource('fog') as GeoJSONSource | undefined)?.setData(data.fog);
    (m.getSource('cells') as GeoJSONSource | undefined)?.setData(data.cells);
    (m.getSource('points') as GeoJSONSource | undefined)?.setData(data.points);
  }, [data]);

  // Fly to the focused point so its cell is visible when it lights up.
  useEffect(() => {
    if (!focus || !map.current) return;
    map.current.flyTo({ center: [focus.lng, focus.lat], zoom: 15, duration: 1200 });
  }, [focus]);

  return (
    <div
      ref={container}
      role="application"
      aria-label="Mapa do Brasil. Use a lista de pontos para navegar com teclado ou leitor de tela."
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}
