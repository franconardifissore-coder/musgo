/**
 * MainPhotoEditor: avatar tappable de la planta. Renderea la foto principal
 * (imagePreview) si existe, sino el emoji. Tap → bottom sheet con
 * "Cámara" / "Galería" → uploadea y persiste.
 *
 * Optimistic: actualiza el plant local primero (preview de la URI del file),
 * luego sube a Storage y sincroniza con la DB. Si falla, revierte.
 */

import { useState } from 'react';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { useToast } from '@/components/ui/Toast';
import { setPlantLocal } from '@/lib/garden-store';
import { upsertPlant } from '@/lib/actions/plants';
import { uploadPlantMainImage } from '@/lib/supabase/photos';
import { getUserIdAsync } from '@/lib/photos-store';
import { PhotoIcon } from '@/components/icons';
import type { Plant } from '@/domain';

export interface MainPhotoEditorProps {
  plant: Plant;
}

export function MainPhotoEditor({ plant }: MainPhotoEditorProps) {
  const { colors, radii } = useTheme();
  const { show: toast } = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function pickAndUpload(source: 'camera' | 'gallery') {
    let r: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        toast('Habilitá la cámara desde Configuración', { variant: 'danger' });
        return;
      }
      r = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        exif: false,
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast('Habilitá la galería desde Configuración', { variant: 'danger' });
        return;
      }
      r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        exif: false,
      });
    }
    if (r.canceled || !r.assets[0]) return;
    const uri = r.assets[0].uri;
    setPickerOpen(false);
    setUploading(true);
    const previousPreview = plant.imagePreview;
    try {
      const userId = await getUserIdAsync();
      // Optimistic: usamos la URI local mientras sube.
      setImgError(false);
      setPlantLocal({ ...plant, imagePreview: uri });
      const url = await uploadPlantMainImage({ plantId: plant.id, userId, uri });
      // Persistir la URL pública (con cache-buster) a la DB.
      await upsertPlant({ ...plant, imagePreview: url });
      toast('🌿 Foto principal actualizada', { variant: 'success' });
    } catch (err) {
      setPlantLocal({ ...plant, imagePreview: previousPreview });
      toast(err instanceof Error ? err.message : 'No pudimos actualizar', { variant: 'danger' });
    } finally {
      setUploading(false);
    }
  }

  const hasImage = Boolean(plant.imagePreview) && !imgError;

  return (
    <>
      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={hasImage ? 'Cambiar foto principal' : 'Agregar foto principal'}
        style={{
          width: '100%',
          aspectRatio: 1,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
          overflow: 'hidden',
          backgroundColor: colors.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasImage ? (
          <Image
            source={{ uri: plant.imagePreview! }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => {
              console.warn('[MainPhotoEditor] Image failed to load:', plant.imagePreview);
              setImgError(true);
            }}
          />
        ) : (
          <Text style={{ fontSize: 96 }}>{plant.emoji}</Text>
        )}
        {/* Overlay con CTA */}
        <Box
          direction="row"
          align="center"
          gap="2"
          px="3"
          py="2"
          style={{
            position: 'absolute',
            bottom: 12,
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderRadius: 999,
          }}
        >
          <PhotoIcon size={16} color="textInverted" />
          <Text variant="caption" color="textInverted" weight="700">
            {uploading
              ? 'Subiendo...'
              : hasImage
                ? 'Cambiar foto principal'
                : 'Agregar foto principal'}
          </Text>
        </Box>
      </Pressable>

      <BottomSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={hasImage ? 'Cambiar foto principal' : 'Agregar foto principal'}
      >
        <Box px="5" pb="3" gap="2">
          <Button
            label="📷  Tomar foto"
            variant="primary"
            onPress={() => pickAndUpload('camera')}
            fullWidth
          />
          <Button
            label="🖼️  Elegir de galería"
            variant="secondary"
            onPress={() => pickAndUpload('gallery')}
            fullWidth
          />
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setPickerOpen(false)}
            fullWidth
          />
        </Box>
      </BottomSheet>
    </>
  );
}
