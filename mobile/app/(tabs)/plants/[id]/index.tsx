/**
 * Detalle de planta con 3 tabs: Riegos / Detalles / Evolución.
 *
 * Patrón:
 * - State local con un `draft` editable. Cada campo del form muta el draft.
 * - Botón "Guardar" único al final que persiste los cambios via `upsertPlant`.
 *   Mientras no se guarda, los cambios viven solo en local (no en el store).
 * - "Eliminar" abre ConfirmDialog y borra.
 *
 * Sin pantalla `[id]/edit.tsx` aparte — la edición es in-place dentro del
 * detalle (replicado del patrón web).
 *
 * Tab Evolución: galería de fotos (port de web), se carga al entrar a la tab.
 */

import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGarden, usePlant, setPlantLocal } from '@/lib/garden-store';
import { deletePlant, upsertPlant } from '@/lib/actions/plants';
import { fetchPlantMetadata } from '@/lib/plant-metadata';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { PlantCalendar } from '@/components/PlantCalendar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  FormField,
  ScreenHeader,
  SelectField,
  Tabs,
  TextField,
  type SelectOption,
  type TabItem,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import {
  EvolucionTab,
  MainPhotoEditor,
  PlantMetadataCard,
  PlantFunFactCard,
} from '@/components/domain';

type TabKey = 'riegos' | 'detalles' | 'evolucion';

const TAB_ITEMS: ReadonlyArray<TabItem<TabKey>> = [
  { key: 'riegos', label: 'Riegos' },
  { key: 'detalles', label: 'Detalles' },
  { key: 'evolucion', label: 'Evolución' },
];

const FREQ_OPTIONS: SelectOption<string>[] = [
  { value: '1', label: 'Cada día' },
  { value: '2', label: 'Cada 2 días' },
  { value: '3', label: 'Cada 3 días' },
  { value: '5', label: 'Cada 5 días' },
  { value: '7', label: 'Cada 7 días' },
  { value: '14', label: 'Cada 14 días' },
  { value: '30', label: 'Cada 30 días' },
];

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = usePlant(id);
  const { sections } = useGarden();
  const { show: toast } = useToast();
  const router = useRouter();
  const { colors } = useTheme();

  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [activeTab, setActiveTab] = useState<TabKey>('riegos');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);

  // Draft editable. Se inicializa con los valores actuales de la planta y
  // se sincroniza si la planta cambia (ej. otro device sincronizó).
  const [draftName, setDraftName] = useState('');
  const [draftFreq, setDraftFreq] = useState<string>('3');
  const [draftSection, setDraftSection] = useState<string | null>(null);

  useEffect(() => {
    if (!plant) return;
    setDraftName(plant.name);
    setDraftFreq(String(plant.freq));
    setDraftSection(plant.section);
  }, [plant?.id, plant?.name, plant?.freq, plant?.section]); // eslint-disable-line react-hooks/exhaustive-deps

  const scientificName = plant?.identifiedSpecies || plant?.species;
  const hasMetadata = Boolean(plant?.metadata);

  // Lazy fetch de metadata si la planta es identificada y no la trae.
  useEffect(() => {
    if (!plant || !scientificName || hasMetadata || metadataLoading) return;
    let cancelled = false;
    setMetadataLoading(true);
    fetchPlantMetadata(scientificName)
      .then((res) => {
        if (cancelled || !res.metadata) return;
        setPlantLocal({ ...plant, metadata: res.metadata });
      })
      .catch(() => {
        // Silent.
      })
      .finally(() => {
        setMetadataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [plant?.id, scientificName, hasMetadata]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!plant) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg">
        <Text variant="body" color="danger">Planta no encontrada</Text>
      </Box>
    );
  }

  const section = sections.find((s) => s.id === plant.section);
  const isIdentified = Boolean(plant.identifiedSpecies);

  async function autoSave(name: string, freq: string, sectionId: string | null) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast('El nombre no puede estar vacío', { variant: 'danger' });
      return;
    }
    // Evitar guardar si no hay cambio real respecto al store
    if (
      trimmedName === plant.name &&
      Number(freq) === plant.freq &&
      sectionId === plant.section
    ) return;
    setSavingDraft(true);
    try {
      await upsertPlant({ ...plant, name: trimmedName, freq: Number(freq) || 3, section: sectionId });
      toast('Guardado', { variant: 'success' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No pudimos guardar', { variant: 'danger' });
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleDelete() {
    if (!plant) return;
    setDeleteBusy(true);
    try {
      await deletePlant(plant);
      setDeleteOpen(false);
      toast('🗑️ Planta eliminada', { variant: 'success' });
      router.back();
    } catch (err) {
      setDeleteBusy(false);
      toast(err instanceof Error ? err.message : 'No pudimos eliminar', { variant: 'danger' });
    }
  }

  const sectionOptions: SelectOption<string | null>[] = [
    { value: null, label: 'Sin asignar' },
    ...sections.map((s) => ({ value: s.id, label: `${s.icon}  ${s.name}` })),
  ];

  return (
    <Box flex={1} bg="bg">
      <ScreenHeader title="Tu planta" onBack={() => router.back()} />
      <Box flex={1}>
        <Tabs items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── TAB RIEGOS ── */}
          {activeTab === 'riegos' ? (
            <>
              <PlantCalendar
                plant={plant}
                year={calYear}
                month={calMonth}
                onMonthChange={(y, m) => {
                  setCalYear(y);
                  setCalMonth(m);
                }}
              />

              <Box gap="5">
                <FormField label="Frecuencia de riego">
                  <SelectField<string>
                    value={draftFreq}
                    options={FREQ_OPTIONS}
                    onChange={(val) => {
                      setDraftFreq(val);
                      void autoSave(draftName, val, draftSection);
                    }}
                    sheetTitle="Frecuencia de riego"
                    disabled={savingDraft}
                  />
                </FormField>
                <FormField label="Espacio" optional>
                  <SelectField<string | null>
                    value={draftSection}
                    options={sectionOptions}
                    onChange={(val) => {
                      setDraftSection(val);
                      void autoSave(draftName, draftFreq, val);
                    }}
                    placeholder="Sin asignar"
                    sheetTitle="Elegir espacio"
                    disabled={savingDraft}
                  />
                </FormField>
              </Box>
            </>
          ) : null}

          {/* ── TAB DETALLES ── */}
          {activeTab === 'detalles' ? (
            <>
              <FormField label="Nombre de la planta">
                <TextField
                  value={draftName}
                  onChangeText={setDraftName}
                  onBlur={() => void autoSave(draftName, draftFreq, draftSection)}
                  placeholder="Nombre"
                  editable={!savingDraft}
                />
              </FormField>

              {/* Hero card: foto principal editable + nombres + metadata */}
              <Card variant="elevated" p="none" radius="lg">
                <Box>
                  <MainPhotoEditor plant={plant} />
                  <Box p="5" gap="4">
                    <Box gap="1">
                      {plant.metadata?.common_name ? (
                        <>
                          <Text variant="label" color="textMuted">
                            Nombre común
                          </Text>
                          <Text variant="h2">{plant.metadata.common_name}</Text>
                        </>
                      ) : null}
                      {plant.species ? (
                        <>
                          <Text variant="label" color="textMuted" style={{ marginTop: plant.metadata?.common_name ? 8 : 0 }}>
                            Nombre científico
                          </Text>
                          <Text variant="bodyMedium" style={{ fontStyle: 'italic' }}>
                            {plant.species}
                          </Text>
                        </>
                      ) : null}
                    </Box>

                    {(plant.metadata || metadataLoading) ? (
                      <Box
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: colors.borderSubtle,
                          paddingTop: 16,
                        }}
                      >
                        <PlantMetadataCard
                          metadata={plant.metadata ?? null}
                          loading={metadataLoading}
                        />
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              </Card>

              {(plant.metadata?.fun_fact || (isIdentified && metadataLoading)) ? (
                <PlantFunFactCard
                  funFact={plant.metadata?.fun_fact ?? null}
                  loading={metadataLoading}
                />
              ) : null}

              {/* Eliminar — ghost, al final del scroll */}
              <Button
                label="Eliminar planta"
                variant="ghost"
                onPress={() => setDeleteOpen(true)}
                fullWidth
              />
            </>
          ) : null}

          {/* ── TAB EVOLUCIÓN ── */}
          {activeTab === 'evolucion' ? <EvolucionTab plantId={plant.id} /> : null}
        </ScrollView>

      </Box>

      <ConfirmDialog
        visible={deleteOpen}
        title="Eliminar planta"
        body={`¿Estás segur@ que deseas eliminar "${plant.name}"? No se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        loading={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
