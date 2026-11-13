import { VIEW_ZOOM, baseLayerRule } from '../mapTheme';

describe('baseLayerRule (level of detail)', () => {
  it('hides the base style estado borders (replaced by IBGE outlines)', () => {
    expect(baseLayerRule({ id: 'boundary_state', 'source-layer': 'boundary' })).toEqual({ hide: true });
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

  it('shows big city names from the estado view and small places only in the município view', () => {
    expect(baseLayerRule({ id: 'place_city' })).toEqual({ minzoom: VIEW_ZOOM.estado });
    expect(baseLayerRule({ id: 'place_village' })).toEqual({ minzoom: VIEW_ZOOM.municipio });
  });

  it('keeps country and estado names, water and land as they are', () => {
    for (const id of ['place_state', 'place_country_major', 'water_name', 'water', 'background']) {
      expect(baseLayerRule({ id })).toBeNull();
    }
  });
});
