/**
 * Detalle de espacio. DS-first.
 * Lista plantas del espacio + editar/eliminar.
 * Regar todas se hace desde la lista de espacios (SpaceCard).
 */

import { useState } from 'react';
import { FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { lastWatered, needsWater, today } from '@/domain';
import { useGarden } from '@/lib/garden-store';
import { deleteSection } from '@/lib/actions/sections';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { PlantTile } from '@/components/domain/PlantTile';
import { waterToday } from '@/lib/actions/plants';
import { Button, ConfirmDialog, EmptyState, ScreenHeader } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';

export default function SectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sections, plants } = useGarden();
  const { show: toast } = useToast();
  const router = useRouter();
  const { colors } = useTheme();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const section = sections.find((s) => s.id === id);
  const sectionPlants = plants.filter((p) => p.section === id);

  if (!section) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg">
        <Text variant="body" color="danger">Espacio no encontrado</Text>
      </Box>
    );
  }

  const thirsty = sectionPlants.filter(needsWater).length;
  async function handleWaterOne(plantId: string) {
    const plant = plants.find((p) => p.id === plantId);
    if (!plant) return;
    setBusyId(plantId);
    try {
      const action = await waterToday(plant);
      toast(action === 'added' ? 'Regada' : 'Riego deshecho', { variant: 'success' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No pudimos sincronizar', { variant: 'danger' });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!section) return;
    setDeleteBusy(true);
    try {
      await deleteSection(section, sectionPlants);
      setDeleteOpen(false);
      router.back();
    } catch (err) {
      setDeleteBusy(false);
      toast(err instanceof Error ? err.message : 'No pudimos eliminar', { variant: 'danger' });
    }
  }

  return (
    <Box flex={1} bg="bg">
      <ScreenHeader title={`${section.icon} ${section.name}`} onBack={() => router.back()} />
      <Box flex={1}>
        <Box p="5" gap="3">
          <Text variant="body" color="textMuted">
            {sectionPlants.length === 0
              ? 'Este espacio está vacío.'
              : thirsty === 0
                ? `${sectionPlants.length} planta${sectionPlants.length === 1 ? '' : 's'}, nadie con sed.`
                : `${thirsty} de ${sectionPlants.length} con sed.`}
          </Text>

        </Box>

        <FlatList
          data={sectionPlants}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
            gap: 10,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              icon="🪴"
              title="Sin plantas"
              body="Escanea una planta nueva o asignala a este espacio desde su detalle."
              ctaLabel="Agregar planta"
              onCtaPress={() => router.push('/(tabs)/scan')}
            />
          }
          renderItem={({ item }) => {
            const isThirsty = needsWater(item);
            const lw = lastWatered(item);
            const wateredTodayFlag = item.waterLog.includes(today());
            return (
              <PlantTile
                plant={item}
                thirsty={isThirsty}
                wateredToday={wateredTodayFlag}
                busy={busyId === item.id}
                lastWateredLabel={lw ?? null}
                onPress={() => router.push(`/(tabs)/plants/${item.id}`)}
                onWaterPress={() => handleWaterOne(item.id)}
              />
            );
          }}
        />

        <Box direction="row" gap="2" px="5" pb="5" pt="3" bg="bg" style={{ borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
          <Box flex={1}>
            <Button
              label="Editar"
              variant="secondary"
              onPress={() => router.push(`/(tabs)/sections/${section.id}/edit`)}
              fullWidth
            />
          </Box>
          <Box flex={1}>
            <Button
              label="Eliminar"
              variant="danger"
              onPress={() => setDeleteOpen(true)}
              fullWidth
            />
          </Box>
        </Box>
      </Box>

      <ConfirmDialog
        visible={deleteOpen}
        title="Eliminar espacio"
        body={`¿Eliminar "${section.name}"? Las plantas quedan sin espacio asignado, no se borran.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
