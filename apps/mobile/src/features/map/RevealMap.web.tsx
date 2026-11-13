// Web map (maplibre-gl). The native version comes after web is validated.
//
// Level of detail (docs/decisoes.md):
//   Brasil    zoom < 5  : estado outlines only; estados with points glow 0-100%
//   Estado    5 to 9    : estado outline highlighted + all município outlines;
//                         municípios with points glow 0-100%; no roads
//   Município zoom >= 9 : roads and streets; city outline stays highlighted; points
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
import {
  baseLayerRule,
  mapColors,
  STYLE_OVERRIDES,
  VEIL_OPACITY,
  VIEW_ZOOM,
} from './mapTheme';
import {
  areaBordersGeoJSON,
  areaProgress,
  areasGeoJSON,
  countryMaskGeoJSON,
  outlineLabelsGeoJSON,
  outlinesGeoJSON,
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
// The camera can't wander far from Brazil (only Brazil is shown).
const MAX_BOUNDS: [number, number, number, number] = [-95, -45, -15, 15];

// Opacity of the progress fill: linear, 0% -> 0 and 100% -> 0.55.
const PROGRESS_FILL = ['*', 0.55, ['get', 'ratio']] as const;
// Highlighted outline of areas with points: visible even at 0% (something to discover).
const HIGHLIGHT_OPACITY = ['+', 0.55, ['*', 0.45, ['get', 'ratio']]] as const;

export function RevealMap({
  points,
  areas,
  stateOutlines,
  municipalityOutlines,
  country,
  discoveries,
  onPointPress,
  focus,
}: RevealMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const onPress = useRef(onPointPress);
  useEffect(() => {
    onPress.current = onPointPress;
  }, [onPointPress]);

  const data = useMemo(() => {
    const estado = areaProgress(points, discoveries, 'estado');
    const municipio = areaProgress(points, discoveries, 'municipio');
    return {
      points: pointsGeoJSON(points, discoveries),
      estado: areasGeoJSON(areas, estado, 'estado'),
      municipio: areasGeoJSON(areas, municipio, 'municipio'),
      estadoBorder: areaBordersGeoJSON(areas, estado, 'estado'),
      municipioBorder: areaBordersGeoJSON(areas, municipio, 'municipio'),
      stateOutlines: outlinesGeoJSON(stateOutlines),
      municipalityOutlines: outlinesGeoJSON(municipalityOutlines),
      mask: countryMaskGeoJSON(country),
      stateLabels: outlineLabelsGeoJSON(stateOutlines),
      municipalityLabels: outlineLabelsGeoJSON(municipalityOutlines),
    };
  }, [points, areas, stateOutlines, municipalityOutlines, country, discoveries]);
  const latest = useRef(data);

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    const m = new MapLibreMap({
      container: container.current,
      style: STYLE_URL,
      bounds: BRAZIL_BOUNDS,
      maxBounds: MAX_BOUNDS,
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

      for (const layer of m.getStyle().layers) {
        // Level of detail: no roads before the município view, fewer labels.
        const rule = baseLayerRule(layer as Parameters<typeof baseLayerRule>[0]);
        if (rule && 'hide' in rule) m.setLayoutProperty(layer.id, 'visibility', 'none');
        else if (rule) m.setLayerZoomRange(layer.id, rule.minzoom, layer.maxzoom ?? 24);

        // Prefer Portuguese place names when the tiles provide them.
        if (layer.type === 'symbol' && m.getLayoutProperty(layer.id, 'text-field')) {
          m.setLayoutProperty(layer.id, 'text-field', [
            'coalesce',
            ['get', 'name:pt'],
            ['get', 'name'],
          ]);
        }
      }

      // Our layers go below the first label layer, so place names stay readable.
      const firstLabel = m.getStyle().layers.find((l) => l.type === 'symbol')?.id;
      const src = latest.current;
      m.addSource('veil', { type: 'geojson', data: VEIL_GEOJSON });
      m.addSource('estado', { type: 'geojson', data: src.estado });
      m.addSource('municipio', { type: 'geojson', data: src.municipio });
      m.addSource('state-outlines', { type: 'geojson', data: src.stateOutlines });
      m.addSource('municipality-outlines', { type: 'geojson', data: src.municipalityOutlines });
      m.addSource('estado-border', { type: 'geojson', data: src.estadoBorder });
      m.addSource('municipio-border', { type: 'geojson', data: src.municipioBorder });
      m.addSource('mask', { type: 'geojson', data: src.mask as never });
      m.addSource('state-labels', { type: 'geojson', data: src.stateLabels });
      m.addSource('municipality-labels', { type: 'geojson', data: src.municipalityLabels });

      const below = (layer: Parameters<typeof m.addLayer>[0]) => m.addLayer(layer, firstLabel);

      below({
        id: 'veil',
        type: 'fill',
        source: 'veil',
        paint: { 'fill-color': mapColors.fog, 'fill-opacity': VEIL_OPACITY },
      });

      // Brasil view: estados with points glow in proportion to discoveries.
      below({
        id: 'estado-progress',
        type: 'fill',
        source: 'estado',
        maxzoom: VIEW_ZOOM.estado,
        paint: { 'fill-color': palette.ochre, 'fill-opacity': PROGRESS_FILL as never },
      });

      // Estado view: municípios with points glow; every município is outlined.
      below({
        id: 'municipio-progress',
        type: 'fill',
        source: 'municipio',
        minzoom: VIEW_ZOOM.estado,
        maxzoom: VIEW_ZOOM.municipio,
        paint: { 'fill-color': palette.ochre, 'fill-opacity': PROGRESS_FILL as never },
      });
      below({
        id: 'municipality-outlines',
        type: 'line',
        source: 'municipality-outlines',
        minzoom: VIEW_ZOOM.estado,
        paint: { 'line-color': mapColors.boundaryState, 'line-width': 0.6, 'line-opacity': 0.8 },
      });

      // Every estado division (inner borders only, no coast), at every zoom.
      below({
        id: 'state-outlines',
        type: 'line',
        source: 'state-outlines',
        paint: {
          'line-color': mapColors.boundaryCountry,
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 9, 1.6],
        },
      });

      // Highlights (inner borders, no coast): the city outline stays highlighted
      // in the município view, the estado outline in the Brasil and estado views.
      below({
        id: 'municipio-highlight',
        type: 'line',
        source: 'municipio-border',
        minzoom: VIEW_ZOOM.estado,
        paint: {
          'line-color': palette.ochre,
          'line-opacity': HIGHLIGHT_OPACITY as never,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.2, 12, 2.5],
        },
      });
      below({
        id: 'estado-highlight',
        type: 'line',
        source: 'estado-border',
        maxzoom: VIEW_ZOOM.municipio + 2,
        paint: {
          'line-color': palette.ochre,
          'line-opacity': HIGHLIGHT_OPACITY as never,
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.5, 9, 3],
        },
      });

      // Only Brazil: cover everything outside it, including foreign labels
      // (this layer is above the base labels; Brazil is a hole in it).
      m.addLayer({
        id: 'mask',
        type: 'fill',
        source: 'mask',
        paint: { 'fill-color': mapColors.water, 'fill-opacity': 1 },
      });

      // Names from IBGE: estados in the Brasil view, municípios in the estado view.
      const labelPaint = {
        'text-color': mapColors.label,
        'text-halo-color': mapColors.halo,
        'text-halo-width': 1.2,
      };
      m.addLayer({
        id: 'state-labels',
        type: 'symbol',
        source: 'state-labels',
        maxzoom: VIEW_ZOOM.estado,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
          'text-transform': 'uppercase',
          'text-max-width': 8,
        },
        paint: labelPaint,
      });
      m.addLayer({
        id: 'municipality-labels',
        type: 'symbol',
        source: 'municipality-labels',
        // From mid estado view: farther out, outlines alone show "how many cities are left".
        minzoom: VIEW_ZOOM.estado + 2,
        maxzoom: VIEW_ZOOM.municipio,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 9, 9, 12],
          'text-max-width': 7,
        },
        paint: labelPaint,
      });

      // Points (from the estado view on): unlit grey, remote ochre ring, visited filled.
      m.addSource('points', { type: 'geojson', data: src.points });
      m.addLayer({
        id: 'points-glow',
        type: 'circle',
        source: 'points',
        minzoom: VIEW_ZOOM.estado,
        filter: ['!=', ['get', 'mode'], 'apagado'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 8, 15, 18],
          'circle-color': palette.ochre,
          'circle-opacity': 0.25,
          'circle-blur': 0.8,
        },
      });
      m.addLayer({
        id: 'points',
        type: 'circle',
        source: 'points',
        minzoom: VIEW_ZOOM.estado,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3.5, 10, 6, 15, 8],
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

  // Update data when anything changes.
  useEffect(() => {
    latest.current = data;
    const m = map.current;
    // Do NOT gate on isStyleLoaded(): it is false while tiles load (e.g. during
    // flyTo), which silently dropped updates. Before 'load', the handler reads latest.current.
    if (!m) return;
    const set = (id: string, d: object) =>
      (m.getSource(id) as GeoJSONSource | undefined)?.setData(d as never);
    set('points', data.points);
    set('estado', data.estado);
    set('municipio', data.municipio);
    set('state-outlines', data.stateOutlines);
    set('municipality-outlines', data.municipalityOutlines);
    set('estado-border', data.estadoBorder);
    set('municipio-border', data.municipioBorder);
    set('mask', data.mask);
    set('state-labels', data.stateLabels);
    set('municipality-labels', data.municipalityLabels);
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
