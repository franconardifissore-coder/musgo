/**
 * Listado de espacios. SpaceCard 1 por fila + FAB.
 */

import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { needsWater } from '@/domain';
import { useGarden, loadGarden } from '@/lib/garden-store';
import { waterSectionToday } from '@/lib/actions/sections';
import { Box } from '@/components/primitives/Box';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { SpaceCard } from '@/components/domain/SpaceCard';
import { EmptyState, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';

export default function SectionsScreen() {
  const { sections, plants, loading, loaded, error } = useGarden();
  const { colors } = useTheme();
  const { show: toast } = useToast();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadGarden();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleWaterAll(sectionId: string) {
    const sectionPlants = plants.filter((p) => p.section === sectionId);
    setBusyId(sectionId);
    try {
      const { updated, skipped } = await waterSectionToday(sectionId, sectionPlants);
      if (updated === 0) {
        toast(skipped > 0 ? 'Ya estaba todo regado hoy' : 'Sin plantas en este espacio');
      } else {
        toast(`Regaste ${updated} planta${updated === 1 ? '' : 's'}`, { variant: 'success' });
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No pudimos sincronizar', { variant: 'danger' });
      // Refresh para reconciliar el estado en caso de error parcial.
      void loadGarden();
    } finally {
      setBusyId(null);
    }
  }

  if (!loaded && loading) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg">
        <ActivityIndicator color={colors.brand} />
      </Box>
    );
  }

  if (error && sections.length === 0) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg" p="6" gap="3">
        <Text variant="body" color="danger" align="center">
          {error}
        </Text>
        <Button label="Reintentar" onPress={() => loadGarden()} />
      </Box>
    );
  }

  return (
    <Box flex={1} bg="bg">
      <Box px="5" pb="2" style={{ paddingTop: insets.top + 20 }}>
        <Text variant="title">Espacios</Text>
      </Box>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
          gap: 10,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🪴"
            title="Aún no tenés espacios"
            body="Los espacios agrupan plantas (Living, Cocina...) y te dejan regar todas de una vez."
            ctaLabel="Crear primer espacio"
            onCtaPress={() => router.push('/(tabs)/sections/new')}
          />
        }
        renderItem={({ item }) => {
          const sectionPlants = plants.filter((p) => p.section === item.id);
          const thirsty = sectionPlants.filter(needsWater).length;
          const noThirsty = thirsty === 0;
          return (
            <SpaceCard
              section={item}
              plantCount={sectionPlants.length}
              thirstyCount={thirsty}
              waterAllDisabled={noThirsty || busyId === item.id}
              onPress={() => router.push(`/(tabs)/sections/${item.id}`)}
              onWaterAll={() => handleWaterAll(item.id)}
            />
          );
        }}
      />

      <Pressable
        onPress={() => router.push('/(tabs)/sections/new')}
        accessibilityRole="button"
        accessibilityLabel="Crear espacio"
        style={{
          position: 'absolute',
          right: 20,
          bottom: insets.bottom + 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.shadow,
          shadowOpacity: 0.22,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <RNText style={{ fontSize: 28, lineHeight: 32, color: '#ffffff', marginTop: -1 }}>
          +
        </RNText>
      </Pressable>
    </Box>
  );
}
