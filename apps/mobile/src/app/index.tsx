import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

// Welcome screen (docs/03, screen 1).
export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/images/arandu-logo.png')}
          style={styles.logo}
          accessibilityLabel="Logo Arandu: mapa do Brasil em pontos, com pontos de luz acesos"
        />
        <Text accessibilityRole="header" style={styles.title}>
          Arandu
        </Text>
        <Text style={styles.slogan}>A sabedoria que acende o mapa.</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Explorar perto de mim"
          accessibilityHint="Usa a localização do aparelho, que não sai dele"
          onPress={() => router.push({ pathname: '/mapa', params: { modo: 'perto' } })}
        />
        <Button
          label="Explorar de qualquer lugar"
          variant="secondary"
          accessibilityHint="Descobre pontos sem precisar estar no local"
          onPress={() => router.push({ pathname: '/mapa', params: { modo: 'remoto' } })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { width: 200, height: 200, marginBottom: 16 },
  title: { fontFamily: fonts.title, fontSize: 40, color: colors.text },
  slogan: { fontFamily: fonts.body, fontSize: 18, color: colors.textMuted, textAlign: 'center' },
  actions: { gap: 12, paddingBottom: 16, width: '100%', maxWidth: 420, alignSelf: 'center' },
});
