// Brand palette: docs/03-experiencia-e-gamificacao.md ("Identidade visual").
export const palette = {
  dark: '#1E2A26',
  light: '#F6F1E7',
  terracottaOnLight: '#B04A24',
  terracottaOnDark: '#E8946B',
  ochre: '#E3B25B',
  softTextOnDark: '#C9D3CC',
} as const;

// Semantic tokens used by components (dark-first UI, like the "unlit" map).
export const colors = {
  background: palette.dark,
  surface: '#26352F',
  text: palette.light,
  textMuted: palette.softTextOnDark,
  accent: palette.terracottaOnDark,
  light: palette.ochre,
  primaryButton: palette.ochre,
  onPrimaryButton: palette.dark,
} as const;

// Text/background pairs that must meet WCAG AA (4.5:1). Checked in tests.
export const textPairs: readonly [name: string, fg: string, bg: string][] = [
  ['text on background', colors.text, colors.background],
  ['muted text on background', colors.textMuted, colors.background],
  ['accent on background', colors.accent, colors.background],
  ['ochre on background', colors.light, colors.background],
  ['text on surface', colors.text, colors.surface],
  ['muted text on surface', colors.textMuted, colors.surface],
  ['button label on primary button', colors.onPrimaryButton, colors.primaryButton],
  ['terracotta on light background', palette.terracottaOnLight, palette.light],
  ['dark text on light background', palette.dark, palette.light],
];
