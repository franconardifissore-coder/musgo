/**
 * PhotoLightbox: modal full-screen para ver una foto con su fecha + nota.
 *
 * No usa BottomSheet porque queremos full-bleed con backdrop oscuro.
 * Implementado con Modal nativo de RN.
 */

import { Image, Modal, Pressable as RNPressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import type { PlantPhoto } from '@/lib/supabase/photos';

export interface PhotoLightboxProps {
  photo: PlantPhoto | null;
  onClose: () => void;
  onRequestDelete: (photo: PlantPhoto) => void;
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PhotoLightbox({ photo, onClose, onRequestDelete }: PhotoLightboxProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={Boolean(photo)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {photo ? (
        <View style={styles.root}>
          <RNPressable
            onPress={onClose}
            style={[
              styles.closeBtn,
              {
                top: insets.top + 12,
                right: 16,
              },
            ]}
            accessibilityLabel="Cerrar"
            accessibilityRole="button"
          >
            <Text variant="h2" color="textInverted">
              ✕
            </Text>
          </RNPressable>

          <Image
            source={{ uri: photo.url }}
            style={styles.image}
            resizeMode="contain"
          />

          <Box
            px="5"
            py="4"
            gap="2"
            style={{
              paddingBottom: insets.bottom + 24,
              backgroundColor: 'rgba(0,0,0,0.65)',
            }}
          >
            <Text variant="caption" color="textInverted">
              {formatLongDate(photo.takenAt)}
            </Text>
            {photo.note ? (
              <Text variant="body" color="textInverted">
                {photo.note}
              </Text>
            ) : null}
            <Box mt="2">
              <Button
                label="🗑️ Eliminar foto"
                variant="danger"
                onPress={() => onRequestDelete(photo)}
                fullWidth
              />
            </Box>
          </Box>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'flex-end',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
