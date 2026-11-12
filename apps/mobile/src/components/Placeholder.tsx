import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

// Temporary screen body for routes not built yet (see docs/08-backlog.md).
export function Placeholder({ title, milestone }: { title: string; milestone: string }) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.body}>[EM CONSTRUÇÃO — {milestone}]</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: { fontFamily: fonts.title, fontSize: 28, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, color: colors.textMuted },
});
