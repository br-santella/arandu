import { VIEW_ZOOM, baseLayerRule } from '../mapTheme';

describe('baseLayerRule (level of detail)', () => {
  it('hides every base style border (estado, country, maritime)', () => {
    for (const id of ['boundary_state', 'boundary_country_z0-4', 'boundary_country_z5-']) {
      expect(baseLayerRule({ id, 'source-layer': 'boundary' })).toEqual({ hide: true });
    }
  });

  it('keeps roads out of the Brasil and estado views', () => {
    for (const sourceLayer of ['transportation', 'transportation_name', 'aeroway']) {
      expect(baseLayerRule({ id: 'x', 'source-layer': sourceLayer })).toEqual({
        minzoom: VIEW_ZOOM.municipio,
      });
    }
  });

  it('never lowers a minzoom the style already has', () => {
    expect(baseLayerRule({ id: 'x', 'source-layer': 'transportation', minzoom: 16 })).toEqual({
      minzoom: 16,
    });
  });

  it('shows base place names only in the município view (IBGE labels before that)', () => {
    for (const id of ['place_city_large', 'place_city', 'place_town', 'place_village']) {
      expect(baseLayerRule({ id })).toEqual({ minzoom: VIEW_ZOOM.municipio });
    }
  });

  it('hides country and base estado names (only Brazil, IBGE names)', () => {
    for (const id of ['place_country_major', 'place_country_minor', 'place_country_other', 'place_state']) {
      expect(baseLayerRule({ id })).toEqual({ hide: true });
    }
  });

  it('keeps water and land as they are', () => {
    for (const id of ['water_name', 'water', 'background']) {
      expect(baseLayerRule({ id })).toBeNull();
    }
  });
});
