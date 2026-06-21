/**
 * Pantalla "Plantas con sed" — filtra el subset de plantas que necesitan
 * riego hoy. Se llega tocando "Ver todo" en el DashboardSummaryCard.
 *
 * Vive como tab oculta (sin entrada en el tab bar via `href: null` en el
 * _layout) para preservar el back-stack del dashboard.
 */

import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { PlantCard } from '@/components/domain/PlantCard';
import { EmptyState, ScreenHeader } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { needsWater, type Plant } from '@/domain';
import { useGarden } from '@/lib/garden-store';
import { waterToday } from '@/lib/actions/plants';
import { useState } from 'react';

export default function ThirstyPlantsScreen() {
  const { plants } = useGarden();
  const { show: toast } = useToast();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const thirstyPlants = plants.filter(needsWater);

  async function handleWaterToday(plant: Plant) {
    setBusyId(plant.id);
    try {
      const action = await waterToday(plant);
      toast(action === 'added' ? '💧 Regada' : 'Riego deshecho', { variant: 'success' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No pudimos sincronizar', { variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Box flex={1} bg="bg">
      <ScreenHeader title="Plantas con sed" onBack={() => router.back()} />
      <Box flex={1}>
        <FlatList
          data={thirstyPlants}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
            gap: 10,
            flexGrow: 1,
          }}
          columnWrapperStyle={{ gap: 10 }}
          ListEmptyComponent={
            <EmptyState
              icon="💧"
              title="Nada para regar hoy"
              body="Tu jardín está al día por ahora."
              ctaLabel="Volver al inicio"
              onCtaPress={() => router.replace('/(tabs)')}
            />
          }
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              busy={busyId === item.id}
              onPress={() => router.push(`/(tabs)/plants/${item.id}`)}
              onWaterPress={() => handleWaterToday(item)}
            />
          )}
        />
      </Box>
    </Box>
  );
}
