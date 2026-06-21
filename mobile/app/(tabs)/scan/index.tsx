/**
 * Pantalla de scan (tab raíz, equivalente a "Agrega una planta" en web).
 *
 * Flujo:
 * 1. Idle: tocar el ScanBox abre un sheet para elegir Cámara o Galería.
 * 2. Scanning: preview de la foto + spinner.
 * 3. Results: preview + lista de matches. Tap en match → navega a `confirm`.
 * 4. Error: mensaje + retry.
 *
 * El estado vive en `scan-store` para que persista entre tab switches y
 * navegación a `confirm`.
 */

import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { ScanBox } from '@/components/domain/ScanBox';
import { IdentifiedPlantCard } from '@/components/domain/IdentifiedPlantCard';
import { Button, BottomSheet } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import { scanImage, type PlantMatch } from '@/lib/scanner';
import {
  resetScan,
  selectScanMatch,
  setScanError,
  setScanImage,
  setScanResult,
  useScan,
} from '@/lib/scan-store';

export default function ScanScreen() {
  const router = useRouter();
  const { show: toast } = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { phase, rawImageUri, result, error } = useScan();
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  async function pickFromCamera() {
    setShowSourcePicker(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast('Habilitá la cámara desde Configuración', { variant: 'danger', duration: 3500 });
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: false,
    });
    if (!picked.canceled && picked.assets[0]) {
      await runScan(picked.assets[0].uri);
    }
  }

  async function pickFromLibrary() {
    setShowSourcePicker(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast('Habilitá la galería desde Configuración', { variant: 'danger', duration: 3500 });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: false,
    });
    if (!picked.canceled && picked.assets[0]) {
      await runScan(picked.assets[0].uri);
    }
  }

  async function runScan(uri: string) {
    setScanImage(uri);
    try {
      const r = await scanImage(uri);
      setScanResult(r);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  function handleSelectMatch(match: PlantMatch) {
    selectScanMatch(match);
    router.push('/(tabs)/scan/confirm');
  }

  function handleManual() {
    router.push('/(tabs)/scan/manual');
  }

  const isLoading = phase === 'scanning';
  const hasResults = phase === 'results' && result;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <Box gap="2">
          <Text variant="title">Agrega una planta</Text>
          <Text variant="body" color="textMuted">
            Enfoca tu planta para identificarla automáticamente o cárgala manualmente.
          </Text>
        </Box>

        <ScanBox
          imageUri={rawImageUri}
          loading={isLoading}
          error={error}
          onPress={phase === 'idle' ? () => setShowSourcePicker(true) : undefined}
          onRetry={error ? () => resetScan() : undefined}
        >
          {hasResults && result ? (
            <Box gap="3" mt="4">
              <Text variant="h2">
                {result.results.length === 0
                  ? 'Sin coincidencias'
                  : 'Coincidencias encontradas'}
              </Text>
              {result.results.map((match) => (
                <IdentifiedPlantCard
                  key={match.scientificName}
                  commonName={match.commonNames[0] ?? match.scientificName}
                  scientificName={match.commonNames[0] ? match.scientificName : null}
                  referenceImageUrl={match.referenceImages[0]?.url ?? null}
                  confidence={Number(match.confidence) / 100}
                  onPress={() => handleSelectMatch(match)}
                />
              ))}
              <Box gap="2" mt="3">
                <Button
                  label="Volver a escanear"
                  variant="secondary"
                  onPress={() => resetScan()}
                  fullWidth
                />
              </Box>
            </Box>
          ) : null}
        </ScanBox>

        {phase === 'idle' && !error ? (
          <Box mt="3" align="center">
            <Button
              label="Crear manualmente"
              variant="ghost"
              onPress={handleManual}
            />
          </Box>
        ) : null}
      </ScrollView>

      {/* Sheet para elegir origen de la foto */}
      <BottomSheet
        visible={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        title="Agregar foto"
      >
        <Box gap="3" pb="2">
          <Button
            label="Cámara"
            variant="primary"
            onPress={pickFromCamera}
            fullWidth
          />
          <Button
            label="Galería"
            variant="secondary"
            onPress={pickFromLibrary}
            fullWidth
          />
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setShowSourcePicker(false)}
            fullWidth
          />
        </Box>
      </BottomSheet>
    </>
  );
}
