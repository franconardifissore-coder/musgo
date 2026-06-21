/**
 * IdentifiedPlantCard: card de resultado del scanner. Layout:
 *   ┌──────────────────────────┐
 *   │  [foto referencia 4:5]   │
 *   │                          │
 *   │  ✓ Match con X% conf.    │  ← chip brand-soft centrado
 *   │                          │
 *   │  Nombre científico       │  ← bold grande
 *   │  Nombre común            │  ← italic, muted
 *   └──────────────────────────┘
 *
 * La card entera es tappable (no usa un Button interno). Si la foto de
 * referencia falla al cargar, se cae al emoji 🌿.
 *
 * Replica el patrón `.scan-match-card` de la web (`styles.css` líneas
 * 1141-1234) traducido a primitives mobile.
 */

import { useState } from 'react';
import { Image, Text as RNText } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { CheckIcon } from '@/components/icons';
import { useTheme } from '@/theme/ThemeProvider';

export interface IdentifiedPlantCardProps {
  commonName: string;
  scientificName?: string | null;
  /** URL de la imagen de referencia de PlantNet, o null si no hay. */
  referenceImageUrl?: string | null;
  /** 0-1 */
  confidence: number | null;
  onPress: () => void;
}

export function IdentifiedPlantCard({
  commonName,
  scientificName,
  referenceImageUrl,
  confidence,
  onPress,
}: IdentifiedPlantCardProps) {
  const theme = useTheme();
  const [imgError, setImgError] = useState(false);

  const confidencePct =
    confidence !== null && !Number.isNaN(confidence)
      ? `${Math.round(confidence * 100)}%`
      : null;

  // El nombre científico va en la posición más prominente (es lo que importa
  // del match). El común va abajo en italic + muted.
  const speciesValue = scientificName || commonName;
  const hasCommon = Boolean(commonName) && commonName !== speciesValue;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Usar ${speciesValue}`}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
        paddingBottom: 18,
        gap: 14,
        ...theme.shadows.xs,
      }}
    >
      {/* Foto de referencia 4:5 (cae a emoji si falla o no hay URL) */}
      <Box
        radius="md"
        bg="surfaceSunken"
        align="center"
        justify="center"
        style={{ width: '100%', aspectRatio: 4 / 5, overflow: 'hidden' }}
      >
        {referenceImageUrl && !imgError ? (
          <Image
            source={{ uri: referenceImageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <RNText style={{ fontSize: 56, lineHeight: 70 }}>🌿</RNText>
        )}
      </Box>

      {/* Chip "Match con X% de confianza" */}
      {confidencePct ? (
        <Box
          direction="row"
          align="center"
          justify="center"
          gap="2"
          bg="brandSoft"
          radius="pill"
          py="2"
          px="3"
        >
          <CheckIcon size={14} color="brand" />
          <Text variant="bodySmall" color="brand" weight="700">
            Match con {confidencePct} de confianza
          </Text>
        </Box>
      ) : null}

      {/* Nombres */}
      <Box gap="1" px="1">
        <Text variant="h2" numberOfLines={2}>
          {speciesValue}
        </Text>
        {hasCommon ? (
          <Text
            variant="body"
            color="textMuted"
            numberOfLines={1}
            style={{ fontStyle: 'italic' }}
          >
            {commonName}
          </Text>
        ) : null}
      </Box>
    </Pressable>
  );
}
