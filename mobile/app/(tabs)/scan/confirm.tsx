/**
 * Confirmación de planta identificada.
 *
 * Tras seleccionar un match en `scan/index`, esta pantalla:
 * 1. Muestra hero card con la foto del usuario + nombres + thumbnail PlantNet.
 * 2. Dispara fetch lazy a `plant-metadata` (Haiku) con loading skeleton.
 * 3. Auto-fill de la frecuencia con `snapToFreqOption(watering_freq_days)`,
 *    a menos que el usuario ya haya tocado el campo (`freqUserChanged`).
 * 4. Renderea metadata + fun fact cuando llegan.
 * 5. Al guardar, crea la planta con la metadata adjunta y va al detalle.
 *
 * Sin calendario de riego (no tiene sentido pre-creación).
 */

import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Card } from '@/components/ui/Card';
import {
  Button,
  FormField,
  TextField,
  SelectField,
  ScreenHeader,
  type SelectOption,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import { useGarden } from '@/lib/garden-store';
import { createPlant, upsertPlant } from '@/lib/actions/plants';
import { uploadPlantMainImage } from '@/lib/supabase/photos';
import { getUserIdAsync } from '@/lib/photos-store';
import { resetScan, useScan } from '@/lib/scan-store';
import {
  fetchPlantMetadata,
  snapToFreqOption,
  type PlantMetadata,
} from '@/lib/plant-metadata';
import { PlantMetadataCard, PlantFunFactCard } from '@/components/domain';

const FREQ_OPTIONS: SelectOption<string>[] = [
  { value: '1', label: 'Cada día' },
  { value: '2', label: 'Cada 2 días' },
  { value: '3', label: 'Cada 3 días' },
  { value: '5', label: 'Cada 5 días' },
  { value: '7', label: 'Cada 7 días' },
  { value: '14', label: 'Cada 14 días' },
  { value: '30', label: 'Cada 30 días' },
];

export default function ConfirmIdentifiedScreen() {
  const router = useRouter();
  const { show: toast } = useToast();
  const { colors } = useTheme();
  const { selectedMatch, rawImageUri } = useScan();
  const { sections } = useGarden();

  const initialName = selectedMatch?.commonNames[0] ?? selectedMatch?.scientificName ?? '';

  const [name, setName] = useState(initialName);
  const [freq, setFreq] = useState<string>('3');
  /** Flag que indica si el usuario tocó freq. Si no, la sobrescribimos con
   *  el valor recomendado por Haiku cuando llegue. */
  const freqUserChangedRef = useRef(false);
  const [section, setSection] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Metadata enrichment state.
  const [metadata, setMetadata] = useState<PlantMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const scientificName = selectedMatch?.scientificName;

  useEffect(() => {
    if (!scientificName) return;
    let cancelled = false;
    setMetadataLoading(true);
    setMetadataError(null);
    fetchPlantMetadata(scientificName)
      .then((res) => {
        if (cancelled) return;
        const meta = res.metadata;
        setMetadata(meta);
        // Auto-fill frecuencia si el usuario no la tocó.
        const recommended = meta?.watering_freq_days ?? null;
        if (recommended && !freqUserChangedRef.current) {
          const snapped = snapToFreqOption(recommended);
          if (snapped) setFreq(String(snapped));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setMetadataError(err instanceof Error ? err.message : 'metadata_failed');
      })
      .finally(() => {
        if (!cancelled) setMetadataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scientificName]);

  if (!selectedMatch) {
    return (
      <Box flex={1} align="center" justify="center" bg="bg" p="6" gap="3">
        <Text variant="body" color="textMuted" align="center">
          No hay planta seleccionada. Volvé a escanear.
        </Text>
        <Button label="Volver a Scan" onPress={() => router.replace('/(tabs)/scan')} />
      </Box>
    );
  }

  const commonName = selectedMatch.commonNames[0];
  const referenceImageUrl = selectedMatch.referenceImages[0]?.url;
  const confidencePct = Math.round(Number(selectedMatch.confidence) || 0);

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError('El nombre es obligatorio');
      return;
    }
    if (!selectedMatch) return;
    setSubmitting(true);
    try {
      const plant = await createPlant({
        name: name.trim(),
        species: selectedMatch.scientificName,
        emoji: '🌿',
        freq: Number(freq) || 3,
        section,
        identifiedSpecies: selectedMatch.scientificName,
        identificationConfidence: Number(selectedMatch.confidence) || null,
      });

      // Upload the scan image as the plant's main photo.
      if (rawImageUri) {
        try {
          const userId = await getUserIdAsync();
          const url = await uploadPlantMainImage({ plantId: plant.id, userId, uri: rawImageUri });
          // Persist Storage URL — non-blocking: plant is already created.
          await upsertPlant({ ...plant, imagePreview: url });
        } catch (photoErr) {
          // Non-fatal: la planta existe sin foto, el user puede añadirla luego.
          // Pero lo logueamos para no volver a tener un fallo silencioso.
          console.warn('[scan/confirm] fallo al subir la foto principal:', photoErr);
          toast('Planta guardada, pero no pudimos subir la foto', { variant: 'danger' });
        }
      }

      resetScan();
      toast('🌱 Planta guardada', { variant: 'success' });
      router.replace(`/(tabs)/plants/${plant.id}`);
    } catch (err) {
      setSubmitting(false);
      toast(err instanceof Error ? err.message : 'No pudimos guardar', { variant: 'danger' });
    }
  }

  const sectionOptions: SelectOption<string | null>[] = [
    { value: null, label: 'Ninguno' },
    ...sections.map((s) => ({ value: s.id, label: `${s.icon}  ${s.name}` })),
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Confirmar planta" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Box gap="1">
          <Text variant="label" color="brand">¡Lo tenemos!</Text>
          <Text variant="title">Planta identificada</Text>
        </Box>

        {/* Hero card con foto del user + nombres + ref de PlantNet + metadata */}
        <Card variant="elevated" p="none" radius="xl">
          <Box>
            {rawImageUri ? (
              <Box style={{ position: 'relative' }}>
                <Image
                  source={{ uri: rawImageUri }}
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                  }}
                  resizeMode="cover"
                />
                {referenceImageUrl ? (
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: colors.surface,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Image
                      source={{ uri: referenceImageUrl }}
                      style={{ width: 72, height: 72 }}
                      resizeMode="cover"
                    />
                    <Box
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: colors.brand,
                        paddingVertical: 2,
                      }}
                    >
                      <Text variant="caption" color="textOnBrand" align="center" weight="700">
                        Ref.
                      </Text>
                    </Box>
                  </Box>
                ) : null}
              </Box>
            ) : null}
            <Box p="5" gap="4">
              <Box direction="row" align="center" gap="2">
                <Box bg="brandSoft" radius="pill" px="3" py="1">
                  <Text variant="caption" color="brand" weight="700">
                    ✓ Match {confidencePct}%
                  </Text>
                </Box>
              </Box>

              <Box gap="1">
                {commonName ? (
                  <>
                    <Text variant="label" color="textMuted">Nombre común</Text>
                    <Text variant="h2">{commonName}</Text>
                  </>
                ) : null}
                <Text variant="label" color="textMuted" style={{ marginTop: commonName ? 8 : 0 }}>
                  Nombre científico
                </Text>
                <Text variant="bodyMedium" style={{ fontStyle: 'italic' }}>
                  {selectedMatch.scientificName}
                </Text>
              </Box>

              {/* Metadata rows: luz / riego / origen */}
              <Box
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.borderSubtle,
                  paddingTop: 16,
                }}
              >
                <PlantMetadataCard metadata={metadata} loading={metadataLoading} />
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Fun fact card */}
        <PlantFunFactCard
          funFact={metadata?.fun_fact ?? null}
          loading={metadataLoading}
        />

        {metadataError ? (
          <Text variant="caption" color="textMuted" align="center">
            No pudimos cargar la metadata, podés guardar igual.
          </Text>
        ) : null}

        {/* Form */}
        <Box gap="5">
          <FormField label="Ponle nombre a tu planta" error={nameError}>
            <TextField
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (nameError) setNameError(null);
              }}
              placeholder="Ej. Mi monstera"
              editable={!submitting}
              hasError={Boolean(nameError)}
            />
          </FormField>

          <FormField label="Frecuencia de riego">
            <SelectField<string>
              value={freq}
              options={FREQ_OPTIONS}
              onChange={(v) => {
                freqUserChangedRef.current = true;
                setFreq(v);
              }}
              sheetTitle="Frecuencia de riego"
              disabled={submitting}
            />
          </FormField>

          {sections.length > 0 ? (
            <FormField label="Espacio" optional>
              <SelectField<string | null>
                value={section}
                options={sectionOptions}
                onChange={setSection}
                placeholder="Sin asignar"
                sheetTitle="Elegir espacio"
                disabled={submitting}
              />
            </FormField>
          ) : null}

          <Button
            label="Guardar"
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
            size="lg"
          />
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
