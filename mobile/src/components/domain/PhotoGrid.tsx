/**
 * PhotoGrid: grid 3 columnas de tiles con preview + fecha + nota.
 * Cada tile es tappable y dispara onPressPhoto.
 */

import { Image, View } from 'react-native';
import { Pressable } from '@/components/primitives/Pressable';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { PlantPhoto } from '@/lib/supabase/photos';

const COLS = 3;
const GAP = 8;

export interface PhotoGridProps {
  photos: PlantPhoto[];
  onPressPhoto: (photo: PlantPhoto) => void;
}

function formatPhotoDate(takenAt: string): string {
  const d = new Date(takenAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function PhotoGrid({ photos, onPressPhoto }: PhotoGridProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
      }}
    >
      {photos.map((photo) => (
        <Pressable
          key={photo.id}
          onPress={() => onPressPhoto(photo)}
          style={{
            // Ancho calculado para que entren 3 columnas con gap.
            width: `${(100 - ((COLS - 1) * GAP) / 3.6) / COLS}%` as `${number}%`,
            aspectRatio: 1,
            borderRadius: theme.radii.sm,
            overflow: 'hidden',
            backgroundColor: theme.colors.surfaceSunken,
          }}
        >
          <Image
            source={{ uri: photo.url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              paddingHorizontal: 4,
              paddingVertical: 3,
            }}
          >
            <Text variant="caption" color="textInverted" align="center" numberOfLines={1}>
              {formatPhotoDate(photo.takenAt)}
            </Text>
          </Box>
        </Pressable>
      ))}
    </View>
  );
}
