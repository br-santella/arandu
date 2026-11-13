import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';

import { PointSheet } from '../features/map/PointSheet';
import { RevealMap } from '../features/map/RevealMap';
import { fetchMapData } from '../features/map/api';
import { type Discovery, type DiscoveryMode, recordDiscovery } from '../features/map/reveal';
import { colors } from '../theme/colors';
import { MIN_TOUCH_TARGET, fonts } from '../theme/typography';

const MODE_LABEL: Record<DiscoveryMode | 'apagado', string> = {
  apagado: 'A descobrir',
  remota: 'Descoberto à distância',
  presencial: 'Visitado',
};

export default function MapScreen() {
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const remote = modo !== 'perto';
  const query = useQuery({ queryKey: ['map-data'], queryFn: fetchMapData });
  const points = query.data?.points ?? [];
  const areas = query.data?.areas ?? [];
  const stateOutlines = query.data?.stateOutlines ?? [];
  const municipalityOutlines = query.data?.municipalityOutlines ?? [];

  // TODO(M2 2.7): persist locally and sync to Supabase.
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = points.find((p) => p.id === openId) ?? null;

  const statusOf = (id: string) => discoveries.find((d) => d.pointId === id)?.mode ?? 'apagado';

  function openPoint(id: string) {
    if (remote) setOpenId(id); // "perto de mim" unlocks by proximity (M2 2.5)
  }

  function closeCard() {
    if (open) {
      setDiscoveries((prev) => recordDiscovery(prev, { pointId: open.id, mode: 'remota' }));
    }
    setOpenId(null);
  }

  const lit = discoveries.length;

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <RevealMap
          points={points}
          areas={areas}
          stateOutlines={stateOutlines}
          municipalityOutlines={municipalityOutlines}
          discoveries={discoveries}
          onPointPress={openPoint}
          focus={open}
        />
      </View>

      <View style={styles.panel}>
        {query.isPending && (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.noticeText}>Carregando os pontos…</Text>
          </View>
        )}
        {query.isError && (
          <View style={styles.notice} accessibilityLiveRegion="assertive">
            <Text style={styles.noticeText}>Não foi possível carregar os pontos.</Text>
            <Button label="Tentar de novo" variant="secondary" onPress={() => query.refetch()} />
          </View>
        )}
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {remote ? 'Explorando de qualquer lugar' : 'Explorando perto de mim (em construção)'} ·{' '}
          {lit} de {points.length} pontos acesos
        </Text>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {points.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.title}. ${MODE_LABEL[statusOf(p.id)]}`}
              accessibilityState={{ disabled: !remote }}
              onPress={() => openPoint(p.id)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <Text style={styles.itemTitle} numberOfLines={1}>
                {p.title}
              </Text>
              <Text style={styles.itemStatus}>{MODE_LABEL[statusOf(p.id)]}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <PointSheet point={open} onClose={closeCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1, position: 'relative' },
  panel: {
    maxHeight: 260,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  noticeText: { fontFamily: fonts.body, color: colors.text, fontSize: 15 },
  status: { fontFamily: fonts.bodyBold, color: colors.text, fontSize: 15, marginBottom: 8 },
  list: { flexGrow: 0 },
  listContent: { gap: 4, paddingBottom: 16 },
  item: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pressed: { opacity: 0.8 },
  itemTitle: { flex: 1, fontFamily: fonts.body, color: colors.text, fontSize: 14 },
  itemStatus: { fontFamily: fonts.bodyBold, color: colors.accent, fontSize: 13 },
});
