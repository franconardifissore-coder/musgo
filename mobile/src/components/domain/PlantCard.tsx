/**
 * PlantCard: card vertical para grilla 2 columnas en el listado de plantas.
 *
 * Layout: foto 1:1 en la parte superior (full-width, flush a los bordes),
 * nombre + status debajo, botón "Regar" al pie.
 */

import { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Text as RNText, View } from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
const H_PAD = 20;   // paddingHorizontal del FlatList
const COL_GAP = 10; // columnWrapperStyle gap
const CARD_W = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;
import { Box } from '@/components/primitives/Box';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { getPlantWaterStatus, type Plant } from '@/domain';
import { WaterStatusIcon } from '@/components/icons';

export interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onWaterPress: () => void;
  busy?: boolean;
}

export function PlantCard({ plant, onPress, onWaterPress, busy = false }: PlantCardProps) {
  const theme = useTheme();
  const status = getPlantWaterStatus(plant);
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(plant.imagePreview) && !imgError;

  return (
    // Wrapper externo: sombra + borde (sin overflow:hidden para que la sombra no se recorte)
    <View
      style={{
        width: CARD_W,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderCard,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.xs,
      }}
    >
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${plant.name}`}
      style={{
        borderRadius: theme.radii.lg,
        overflow: 'hidden',
      }}
    >
      {/* Foto 1:1 flush arriba */}
      <View style={{ width: '100%', aspectRatio: 1 }}>
        {hasImage ? (
          <Image
            source={{ uri: plant.imagePreview! }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.brandSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText style={{ fontSize: 40, lineHeight: 50 }}>{plant.emoji}</RNText>
          </View>
        )}
      </View>

      {/* Contenido */}
      <Box gap="1" style={{ padding: 12, paddingBottom: 10 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {plant.name}
        </Text>
        <Box direction="row" align="center" gap="2">
          <WaterStatusIcon status={status.kind} size={14} />
          <Text
            variant="bodySmall"
            color={
              status.kind === 'overdue'
                ? 'danger'
                : status.kind === 'today' || status.kind === 'tomorrow'
                  ? 'brand'
                  : 'textMuted'
            }
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {status.text}
          </Text>
        </Box>
      </Box>

      {/* Botón Regar */}
      <Box style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
        <Pressable
          onPress={onWaterPress}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Regar"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: 40,
            borderRadius: theme.radii.pill,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.brand,
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color={theme.colors.brandSoftText} />
          ) : (
            <Text variant="bodySmall" color="brandSoftText">
              Regar
            </Text>
          )}
        </Pressable>
      </Box>
    </Pressable>
    </View>
  );
}
