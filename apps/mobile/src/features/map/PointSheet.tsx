// Provisional point card (the full card with sources and validation is M3, task 3.1).
// Closing the card is what lights the point (docs/decisoes.md).
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { MapPoint } from './reveal';

type Props = { point: MapPoint | null; onClose: () => void };

export function PointSheet({ point, onClose }: Props) {
  return (
    <Modal visible={point !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.title}>
            {point?.title}
          </Text>
          <Text style={styles.body}>[EM CONSTRUÇÃO — cartão completo no M3]</Text>
          <Button label="Fechar e acender o ponto" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    gap: 16,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, color: colors.textMuted },
});
