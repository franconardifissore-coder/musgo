/**
 * Dashboard rediseñado con el nuevo DS.
 *
 * Componentes: DashboardSummaryCard (héroe) + DashboardChartCard (proyección).
 * Lee del store global (useGarden) para reflejar optimistic updates en vivo.
 */

import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGarden, loadGarden } from '@/lib/garden-store';
import {
  getDashboardWaterProjection,
  needsWater,
  type DashboardWaterProjectionDay,
} from '@/domain';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import {
  DashboardChartCard,
  DashboardSummaryCard,
} from '@/components/domain';
import { Button, EmptyState } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function DashboardScreen() {
  const { plants, loaded, loading, error } = useGarden();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadGarden();
    } finally {
      setRefreshing(false);
    }
  }

  if (!loaded && loading) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg">
        <ActivityIndicator color={colors.brand} />
      </Box>
    );
  }

  if (error && !loaded) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg" p="6" gap="3">
        <Text variant="body" color="danger" align="center">
          {error}
        </Text>
        <Button label="Reintentar" onPress={() => loadGarden()} />
      </Box>
    );
  }

  const projection: DashboardWaterProjectionDay[] = getDashboardWaterProjection(plants, 5);
  const thirstyToday = plants.filter(needsWater).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 20,
        paddingBottom: 40,
        gap: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.brand}
        />
      }
    >
      <Box gap="1">
        <Text variant="title">Tu vista diaria</Text>
      </Box>

      {plants.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="Empezá tu jardín"
          body="Agregá tu primera planta para ver el resumen acá."
        />
      ) : (
        <>
          <DashboardSummaryCard
            thirstyCount={thirstyToday}
            totalPlants={plants.length}
            onPressSeeAll={() => router.push('/(tabs)/thirsty')}
          />
          <DashboardChartCard projection={projection} />
        </>
      )}
    </ScrollView>
  );
}
