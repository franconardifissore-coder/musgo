/**
 * Listado de plantas. PlantTile 1 por fila (foto izq + meta + water btn der).
 *
 * Tap en card → detalle. Tap en water button → toggle riego hoy.
 * Para agregar una planta el usuario va a la tab Scan (no hay FAB acá).
 *
 * Si hay secciones, ChipRow para filtrar por espacio.
 */

import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { type Plant } from '@/domain';
import { useGarden, loadGarden } from '@/lib/garden-store';
import { waterToday } from '@/lib/actions/plants';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { PlantCard } from '@/components/domain/PlantCard';
import { Button, Chip, ChipRow, EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';

const ALL = '__all__';

export default function PlantsScreen() {
  const { plants, sections, loading, loaded, error } = useGarden();
  const { colors } = useTheme();
  const { show: toast } = useToast();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>(ALL);
  const router = useRouter();

  const filteredPlants = useMemo(() => {
    if (activeSection === ALL) return plants;
    return plants.filter((p) => p.section === activeSection);
  }, [plants, activeSection]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadGarden();
    } finally {
      setRefreshing(false);
    }
  }

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

  if (!loaded && loading) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg">
        <ActivityIndicator color={colors.brand} />
      </Box>
    );
  }

  if (error && plants.length === 0) {
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
      <Box px="5" pb="3" gap="3" style={{ paddingTop: insets.top + 20 }}>
        <Text variant="title">Tu Jardín</Text>
        {sections.length > 0 ? (
          <Box style={{ marginHorizontal: -20 }}>
            <ChipRow>
              <Chip
                label="Todos"
                active={activeSection === ALL}
                onPress={() => setActiveSection(ALL)}
              />
              {sections.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  leftSlot={<Text style={{ fontSize: 14 }}>{s.icon}</Text>}
                  active={activeSection === s.id}
                  onPress={() => setActiveSection(s.id)}
                />
              ))}
            </ChipRow>
          </Box>
        ) : null}
      </Box>

      <FlatList
        key="plant-grid"
        data={filteredPlants}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 10,
          flexGrow: 1,
        }}
        columnWrapperStyle={{ gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
          />
        }
        ListEmptyComponent={
          activeSection === ALL ? (
            <EmptyState
              icon="🌱"
              title="Sin plantas todavía"
              body="Empieza a subir tus plantas al jardín y no te perderás un solo riego."
              ctaLabel="Añadir planta"
              onCtaPress={() => router.push('/(tabs)/scan')}
            />
          ) : (
            <EmptyState
              icon="🌱"
              title="Sin plantas en este espacio"
              body="Movés plantas a este espacio editándolas."
            />
          )
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
  );
}
