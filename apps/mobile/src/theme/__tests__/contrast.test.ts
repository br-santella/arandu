import { colors, textPairs } from '../colors';
import { WCAG_AA_TEXT, contrastRatio, relativeLuminance } from '../contrast';

describe('contrastRatio', () => {
  it('matches known WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio(colors.text, colors.background)).toBeCloseTo(
      contrastRatio(colors.background, colors.text),
      10,
    );
  });

  it('rejects invalid colors', () => {
    expect(() => relativeLuminance('red')).toThrow();
  });
});

describe('theme accessibility', () => {
  it.each(textPairs)('%s meets WCAG AA (4.5:1)', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });
});
