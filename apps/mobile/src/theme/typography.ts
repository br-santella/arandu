import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';

// Titles: Fraunces. Body: DM Sans (docs/03).
export const fontAssets = {
  Fraunces_600SemiBold,
  DMSans_400Regular,
  DMSans_700Bold,
};

export const fonts = {
  title: 'Fraunces_600SemiBold',
  body: 'DMSans_400Regular',
  bodyBold: 'DMSans_700Bold',
} as const;

// Minimum touch target (CLAUDE.md: at least 44 pt).
export const MIN_TOUCH_TARGET = 44;
