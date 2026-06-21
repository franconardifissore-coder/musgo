/**
 * PhotoUploadSheet: bottom sheet para subir una foto al timeline.
 *
 * Flujo:
 * 1. Open → muestra dropzone "Tocá para elegir foto" (abre ImagePicker o cámara).
 * 2. Foto elegida → preview + textarea de nota + botón Guardar.
 * 3. Guardar → uploadAndSavePhoto → cierra + prepend al store.
 */

import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import { addPhoto } from '@/lib/photos-store';
import { PhotoIcon } from '@/components/icons';

export interface PhotoUploadSheetProps {
  visible: boolean;
  plantId: string;
  onClose: () => void;
}

type Source = 'camera' | 'gallery';

export function PhotoUploadSheet({ visible, plantId, onClose }: PhotoUploadSheetProps) {
  const { colors } = useTheme();
  const { show: toast } = useToast();
  const [uri, setUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset al cerrar.
  useEffect(() => {
    if (!visible) {
      setUri(null);
      setNote('');
      setLoading(false);
    }
  }, [visible]);

  async function pick(source: Source) {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        toast('Habilitá la cámara desde Configuración', { variant: 'danger' });
        return;
      }
      const r = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        exif: false,
      });
      if (!r.canceled && r.assets[0]) setUri(r.assets[0].uri);
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast('Habilitá la galería desde Configuración', { variant: 'danger' });
        return;
      }
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        exif: false,
      });
      if (!r.canceled && r.assets[0]) setUri(r.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!uri) return;
    setLoading(true);
    try {
      await addPhoto({ plantId, uri, note: note.trim() || null });
      toast('📸 Foto guardada', { variant: 'success' });
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No pudimos guardar', { variant: 'danger' });
      setLoading(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Nueva foto" dismissOnBackdrop={!loading}>
      <Box px="5" pb="3" gap="4">
        {uri ? (
          <Image
            source={{ uri }}
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 16,
              backgroundColor: colors.surfaceSunken,
            }}
            resizeMode="cover"
          />
        ) : (
          <Box direction="row" gap="2">
            <Box flex={1}>
              <Pressable
                onPress={() => pick('camera')}
                style={{
                  height: 120,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: colors.brand,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: colors.surfaceSunken,
                }}
              >
                <PhotoIcon size={28} color="brand" />
                <Text variant="bodySmall" color="brand" weight="600">
                  Cámara
                </Text>
              </Pressable>
            </Box>
            <Box flex={1}>
              <Pressable
                onPress={() => pick('gallery')}
                style={{
                  height: 120,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: colors.surfaceSunken,
                }}
              >
                <Text style={{ fontSize: 24 }}>🖼️</Text>
                <Text variant="bodySmall" color="text" weight="600">
                  Galería
                </Text>
              </Pressable>
            </Box>
          </Box>
        )}

        <TextField
          placeholder="Nota opcional (ej. Le salió una hoja nueva)"
          value={note}
          onChangeText={setNote}
          editable={!loading}
          multiline
          numberOfLines={2}
        />

        <Box direction="row" gap="2">
          <Box flex={1}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} disabled={loading} fullWidth />
          </Box>
          <Box flex={2}>
            <Button
              label="Guardar foto"
              onPress={handleSave}
              loading={loading}
              disabled={!uri}
              fullWidth
            />
          </Box>
        </Box>
      </Box>
    </BottomSheet>
  );
}
