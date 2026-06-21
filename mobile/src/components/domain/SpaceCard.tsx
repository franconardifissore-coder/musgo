/**
 * SpaceCard: card de espacio (sección) en lista vertical.
 *
 * Inspirada en `.space-card` web. Layout: icon arriba a la izquierda,
 * nombre grande, contador de plantas + sedientas, dos botones al pie.
 */

import { Text as RNText } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import type { Section } from '@/domain';

export interface SpaceCardProps {
  section: Section;
  plantCount: number;
  thirstyCount: number;
  onPress: () => void;
  onWaterAll?: () => void;
  /** Si true, ocultamos botón Regar todas (ej. no hay plantas o ya no hay sed). */
  waterAllDisabled?: boolean;
}

export function SpaceCard({
  section,
  plantCount,
  thirstyCount,
  onPress,
  onWaterAll,
  waterAllDisabled = false,
}: SpaceCardProps) {
  const theme = useTheme();

  return (
    <Box
      bg="surface"
      radius="lg"
      borderColor="borderCard"
      borderWidth={1}
      style={{ gap: 14, ...theme.shadows.xs }}
    >
      {/* Área superior: toda ella es tappable → navega al detalle */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir espacio ${section.name}`}
        style={{ padding: 18, paddingBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Box
          align="center"
          justify="center"
          radius="md"
          bg="brandSoft"
          style={{ width: 56, height: 56 }}
        >
          <RNText style={{ fontSize: 28, lineHeight: 36 }}>{section.icon}</RNText>
        </Box>
        <Box flex={1} gap="1">
          <Text variant="h3" numberOfLines={1}>
            {section.name}
          </Text>
          <Text variant="bodySmall" color="textMuted">
            {plantCount === 0
              ? 'Sin plantas'
              : plantCount === 1
                ? `${plantCount} Planta`
                : `${plantCount} Plantas`}
            {thirstyCount > 0
              ? `  ·  ${thirstyCount} con sed`
              : ''}
          </Text>
        </Box>
      </Pressable>

      {/* Botones: View normal, sin Pressable padre → no hay conflicto de eventos */}
      <Box direction="row" gap="2" px="4" pb="4">
        <Box flex={1}>
          <Button label="Ver" variant="secondary" onPress={onPress} fullWidth />
        </Box>
        {onWaterAll ? (
          <Box flex={1}>
            <Button
              label="Regar todas"
              variant="brandSoft"
              onPress={onWaterAll}
              disabled={waterAllDisabled || plantCount === 0}
              fullWidth
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
