/**
 * PlantTile: card de planta en lista vertical (1 por fila).
 *
 * Layout: foto full-height pegada al borde izquierdo (mismo patrón web),
 * nombre + status en el centro, water button fijo a la derecha.
 */

import { useState } from 'react';
import { ActivityIndicator, Image, Text as RNText, View } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { getPlantWaterStatus, type Plant } from '@/domain';
import { WaterStatusIcon, WaterCanIcon } from '@/components/icons';

export interface PlantTileProps {
  plant: Plant;
  onPress: () => void;
  onWaterPress: () => void;
  wateredToday: boolean;
  thirsty: boolean;
  busy?: boolean;
  lastWateredLabel?: string | null;
}

export function PlantTile({
  plant,
  onPress,
  onWaterPress,
  busy = false,
}: PlantTileProps) {
  const theme = useTheme();
  const status = getPlantWaterStatus(plant);
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(plant.imagePreview) && !imgError;

  return (
    <View
      style={{
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
        flexDirection: 'row',
        alignItems: 'stretch',
        height: 88,
        borderRadius: theme.radii.lg,
        overflow: 'hidden',
      }}
    >
      {/* Foto full-height, flush al borde izquierdo */}
      <View style={{ width: 88 }}>
        {hasImage ? (
          <Image
            source={{ uri: plant.imagePreview! }}
            style={{ width: 88, height: '100%' }}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View
            style={{
              width: 88,
              flex: 1,
              backgroundColor: theme.colors.brandSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText style={{ fontSize: 32, lineHeight: 40 }}>{plant.emoji}</RNText>
          </View>
        )}
      </View>

      {/* Body */}
      <Box flex={1} gap="1" style={{ minWidth: 0, paddingLeft: 14, justifyContent: 'center' }}>
        <Text variant="h3" numberOfLines={1}>
          {plant.name}
        </Text>
        <Box direction="row" align="center" gap="2">
          <WaterStatusIcon status={status.kind} size={16} />
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

      {/* Water button — siempre secondary, siempre WaterCanIcon */}
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}>
        <Pressable
          onPress={onWaterPress}
          disabled={busy}
          hitSlop={theme.layout.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Regar hoy"
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color={theme.colors.brand} />
          ) : (
            <WaterCanIcon size={22} color="brand" />
          )}
        </Pressable>
      </View>
    </Pressable>
    </View>
  );
}
