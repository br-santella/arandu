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
import { mapColors, STYLE_OVERRIDES, VEIL_OPACITY } from './mapTheme';
import {
  AREA_ZOOM,
  type AreaLevel,
  areaProgress,
  areasGeoJSON,
  pointsGeoJSON,
  VEIL_GEOJSON,
} from './reveal';
import type { RevealMapProps } from './RevealMap.types';

// Worker file copied to public/ by scripts/copy-maplibre-worker.mjs.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/dark';

// Brazil, roughly: [west, south, east, north]
const BRAZIL_BOUNDS: [number, number, number, number] = [-74, -34, -34, 5.5];

const LEVELS: AreaLevel[] = ['estado', 'municipio'];

export function RevealMap({ points, areas, discoveries, onPointPress, focus }: RevealMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const onPress = useRef(onPointPress);
  useEffect(() => {
    onPress.current = onPointPress;
  }, [onPointPress]);

  const data = useMemo(
    () => ({
      points: pointsGeoJSON(points, discoveries),
      areas: Object.fromEntries(
        LEVELS.map((level) => [
          level,
          areasGeoJSON(areas, areaProgress(points, discoveries, level), level),
        ]),
      ) as Record<AreaLevel, ReturnType<typeof areasGeoJSON>>,
    }),
    [points, areas, discoveries],
  );
  const latest = useRef(data);

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    const m = new MapLibreMap({
      container: container.current,
      style: STYLE_URL,
      bounds: BRAZIL_BOUNDS,
      attributionControl: { compact: true, customAttribution: 'Limites: IBGE' },
    });
    map.current = m;
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    m.on('load', () => {
      // Night-mode palette: readable land/ocean contrast, light borders and labels.
      for (const [layerId, property, value] of STYLE_OVERRIDES) {
        if (!m.getLayer(layerId)) continue; // a future style may drop a layer
        m.setPaintProperty(layerId, property as Parameters<typeof m.setPaintProperty>[1], value);
      }

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

      // Veil and areas go below the first label layer, so place names stay bright.
      const firstLabel = m.getStyle().layers.find((l) => l.type === 'symbol')?.id;

      m.addSource('veil', { type: 'geojson', data: VEIL_GEOJSON });
      m.addLayer(
        {
          id: 'veil',
          type: 'fill',
          source: 'veil',
          paint: { 'fill-color': mapColors.fog, 'fill-opacity': VEIL_OPACITY },
        },
        firstLabel,
      );

      // Estados (wide view) and municípios (regional view) glow from 0% to 100%
      // in proportion to discovered / published points. Inside a city: no areas.
      for (const level of LEVELS) {
        const source = `area-${level}`;
        const { minZoom, maxZoom } = AREA_ZOOM[level];
        m.addSource(source, { type: 'geojson', data: latest.current.areas[level] });
        m.addLayer(
          {
            id: `${source}-glow`,
            type: 'fill',
            source,
            minzoom: minZoom,
            maxzoom: maxZoom,
            paint: {
              'fill-color': palette.ochre,
              'fill-opacity': ['*', 0.55, ['get', 'ratio']], // linear: 0% -> 0, 100% -> 0.55
            },
          },
          firstLabel,
        );
        m.addLayer(
          {
            id: `${source}-outline`,
            type: 'line',
            source,
            minzoom: minZoom,
            maxzoom: maxZoom,
            paint: {
              'line-color': palette.ochre,
              // Faint outline even at 0%: there is something to discover here.
              'line-opacity': ['+', 0.3, ['*', 0.6, ['get', 'ratio']]],
              'line-width': 1.2,
            },
          },
          firstLabel,
        );
      }

      // Points: unlit (grey), remote (ochre ring), visited (filled ochre).
      m.addSource('points', { type: 'geojson', data: latest.current.points });
      m.addLayer({
        id: 'points-glow',
        type: 'circle',
        source: 'points',
        filter: ['!=', ['get', 'mode'], 'apagado'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 8, 15, 18],
          'circle-color': palette.ochre,
          'circle-opacity': 0.25,
          'circle-blur': 0.8,
        },
      });
      m.addLayer({
        id: 'points',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3.5, 10, 6, 15, 8],
          'circle-color': [
            'match',
            ['get', 'mode'],
            'presencial',
            palette.ochre,
            'remota',
            mapColors.land,
            colors.textMuted,
          ],
          'circle-opacity': ['match', ['get', 'mode'], 'apagado', 0.6, 1],
          'circle-stroke-color': ['match', ['get', 'mode'], 'apagado', palette.dark, palette.ochre],
          'circle-stroke-width': ['match', ['get', 'mode'], 'remota', 2.5, 1.5],
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

  // Update data when points, areas or discoveries change.
  useEffect(() => {
    latest.current = data;
    const m = map.current;
    // Do NOT gate on isStyleLoaded(): it is false while tiles load (e.g. during
    // flyTo), which silently dropped updates. Before 'load', the handler reads latest.current.
    if (!m) return;
    (m.getSource('points') as GeoJSONSource | undefined)?.setData(data.points);
    for (const level of LEVELS) {
      (m.getSource(`area-${level}`) as GeoJSONSource | undefined)?.setData(data.areas[level]);
    }
  }, [data]);

  // Fly to the focused point.
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
