// Night-mode overrides for the OpenFreeMap "dark" style, in Arandu's palette.
// The stock style has near-black land (rgb 12) and water barely lighter (rgb 27),
// so land and ocean were hard to tell apart under the fog. Here land is a
// green-grey, water is clearly darker, borders and place names are light.

import { palette } from '../../theme/colors';

export const mapColors = {
  land: '#2E3B36',
  landAlt: '#34433D', // parks, woods
  water: '#0F1A17',
  roadMinor: '#3D4A45',
  roadMajor: '#55645E',
  boundaryCountry: '#A9B7B0',
  boundaryState: '#6E7D76',
  label: '#E8ECEA',
  labelMuted: '#AEBBB5',
  halo: palette.dark,
  fog: '#05080A',
} as const;

// Unrevealed areas are dimmed, but the map stays readable underneath.
export const FOG_OPACITY = 0.5;

type Override = [layerId: string, property: string, value: string | number];

export const STYLE_OVERRIDES: Override[] = [
  ['background', 'background-color', mapColors.land],
  ['landcover_ice_shelf', 'fill-color', mapColors.land],
  ['landuse_residential', 'fill-color', mapColors.land],
  ['landcover_wood', 'fill-color', mapColors.landAlt],
  ['landuse_park', 'fill-color', mapColors.landAlt],
  ['water', 'fill-color', mapColors.water],
  ['waterway', 'line-color', mapColors.water],
  ['building', 'fill-color', '#27332F'],
  ['building', 'fill-outline-color', mapColors.roadMinor],
  ['highway_path', 'line-color', mapColors.roadMinor],
  ['highway_minor', 'line-color', mapColors.roadMinor],
  ['highway_major_casing', 'line-color', mapColors.roadMajor],
  ['highway_major_inner', 'line-color', mapColors.roadMinor],
  ['highway_major_subtle', 'line-color', mapColors.roadMajor],
  ['highway_motorway_casing', 'line-color', mapColors.roadMajor],
  ['highway_motorway_inner', 'line-color', mapColors.roadMinor],
  ['highway_motorway_subtle', 'line-color', mapColors.roadMajor],
  ['boundary_state', 'line-color', mapColors.boundaryState],
  ['boundary_country_z0-4', 'line-color', mapColors.boundaryCountry],
  ['boundary_country_z5-', 'line-color', mapColors.boundaryCountry],
  ['boundary_country_z0-4', 'line-width', 1.2],
  ['boundary_country_z5-', 'line-width', 1.5],
  ['water_name', 'text-color', mapColors.labelMuted],
  ['water_name', 'text-halo-color', mapColors.halo],
  ['highway_name_other', 'text-color', mapColors.labelMuted],
  ['highway_name_other', 'text-halo-color', mapColors.halo],
  ['highway_name_motorway', 'text-color', mapColors.labelMuted],
  ...[
    'place_other',
    'place_suburb',
    'place_village',
    'place_town',
    'place_city',
    'place_city_large',
    'place_state',
    'place_country_other',
    'place_country_minor',
    'place_country_major',
  ].flatMap((id): Override[] => [
    [id, 'text-color', mapColors.label],
    [id, 'text-halo-color', mapColors.halo],
    [id, 'text-halo-width', 1.2],
  ]),
];
