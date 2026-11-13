import { haversineMeters, isWithinRadius } from '../geo';

describe('haversineMeters', () => {
  it('is zero for the same point', () => {
    expect(haversineMeters({ lat: -23.5, lng: -46.6 }, { lat: -23.5, lng: -46.6 })).toBe(0);
  });

  it('matches one degree of latitude (~111.2 km)', () => {
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(111_100);
    expect(d).toBeLessThan(111_300);
  });

  it('is symmetric', () => {
    const a = { lat: -23.55, lng: -46.63 };
    const b = { lat: -22.9, lng: -43.2 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });
});

describe('isWithinRadius', () => {
  const target = { lat: 0, lng: 0 };
  // 0.0005 degrees of latitude is ~55.6 m
  const near = { lat: 0.0005, lng: 0 };

  it('accepts a position inside the radius', () => {
    expect(isWithinRadius(near, target, 75)).toBe(true);
  });

  it('rejects a position outside the radius', () => {
    expect(isWithinRadius(near, target, 50)).toBe(false);
  });
});
