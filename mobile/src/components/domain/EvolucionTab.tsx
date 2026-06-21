/**
 * EvolucionTab: tab "Evolución" del plant detail.
 * Galería de fotos por planta con upload + lightbox + delete.
 *
 * Se monta como contenido de la tab. Al primer mount, dispara load de fotos
 * desde Supabase. La store local cachea por plantId para no re-fetcheear.
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import {
  loadPhotos,
  usePhotos,
  deletePhoto,
} from '@/lib/photos-store';
import { PhotoGrid } from './PhotoGrid';
import { PhotoUploadSheet } from './PhotoUploadSheet';
import { PhotoLightbox } from './PhotoLightbox';
import type { PlantPhoto } from '@/lib/supabase/photos';

export interface EvolucionTabProps {
  plantId: string;
}

export function EvolucionTab({ plantId }: EvolucionTabProps) {
  const { colors } = useTheme();
  const { show: toast } = useToast();
  const bucket = usePhotos(plantId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PlantPhoto | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void loadPhotos(plantId);
  }, [plantId]);

  async function handleConfirmDelete() {
    if (!deletingId) return;
    try {
      await deletePhoto(plantId, deletingId);
      toast('🗑️ Foto eliminada', { variant: 'success' });
      setDeleteOpen(false);
      setDeletingId(null);
      setLightboxPhoto(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No pudimos eliminar', { variant: 'danger' });
    }
  }

  function handleRequestDelete(photo: PlantPhoto) {
    setDeletingId(photo.id);
    setDeleteOpen(true);
  }

  return (
    <Card variant="flat" p="5">
      <Box gap="4">
        <Box direction="row" justify="space-between" align="center">
          <Text variant="h2">Evolución</Text>
          <Button label="＋ Agregar foto" variant="ghost" size="sm" onPress={() => setUploadOpen(true)} />
        </Box>

        {bucket.loading && bucket.photos.length === 0 ? (
          <Box align="center" py="6">
            <ActivityIndicator color={colors.brand} />
          </Box>
        ) : bucket.error ? (
          <Box align="center" py="6" gap="2">
            <Text variant="body" color="danger" align="center">
              {bucket.error}
            </Text>
            <Button label="Reintentar" variant="secondary" size="sm" onPress={() => loadPhotos(plantId)} />
          </Box>
        ) : bucket.photos.length === 0 ? (
          <Box align="center" py="6" gap="2">
            <Text variant="body" color="textMuted" align="center">
              Sube fotos para seguir la evolución de tu planta.
            </Text>
            <Button label="Agregar primera foto" onPress={() => setUploadOpen(true)} />
          </Box>
        ) : (
          <PhotoGrid photos={bucket.photos} onPressPhoto={setLightboxPhoto} />
        )}
      </Box>

      <PhotoUploadSheet
        visible={uploadOpen}
        plantId={plantId}
        onClose={() => setUploadOpen(false)}
      />
      <PhotoLightbox
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
        onRequestDelete={handleRequestDelete}
      />
      <ConfirmDialog
        visible={deleteOpen}
        title="Eliminar foto"
        body="¿Seguro? No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeletingId(null);
        }}
      />
    </Card>
  );
}
