import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';
import { MIN_TOUCH_TARGET, fonts } from '../theme/typography';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
};

export function Button({ label, onPress, variant = 'primary', accessibilityHint }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: primary ? colors.onPrimaryButton : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primaryButton },
  secondary: { borderWidth: 1.5, borderColor: colors.textMuted },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
