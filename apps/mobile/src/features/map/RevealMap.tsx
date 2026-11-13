// Native placeholder. The prototype targets web first (docs/decisoes.md);
// Android and iOS will use @maplibre/maplibre-react-native once web is validated.
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { RevealMapProps } from './RevealMap.types';

export function RevealMap(_props: RevealMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>O mapa está disponível na versão web por enquanto.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontFamily: fonts.body, color: colors.textMuted, textAlign: 'center' },
});
