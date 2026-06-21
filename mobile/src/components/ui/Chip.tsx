/**
 * Chip y ChipRow.
 *
 * - Chip: pill tappable con label opcional + emoji/icon. Estados normal / active.
 * - ChipRow: contenedor horizontal con scroll. Agrupa chips de filtro.
 *
 * Patrón inspirado en `.filter-chip` de la web, recalibrado a feel nativo
 * (altura 36px, padding cómodo, sin sombras agresivas).
 */

import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  leftSlot?: ReactNode;
}

export function Chip({ label, active = false, onPress, leftSlot }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: theme.radii.pill,
        backgroundColor: active ? theme.colors.brand : theme.colors.surface,
        borderWidth: 1,
        borderColor: active ? theme.colors.brand : theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {leftSlot}
      <Text
        variant="bodySmall"
        weight="600"
        color={active ? 'textOnBrand' : 'text'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export interface ChipRowProps {
  children: ReactNode;
  /** Padding horizontal del contenedor (se aplica al scroll). */
  contentPaddingHorizontal?: number;
}

export function ChipRow({
  children,
  contentPaddingHorizontal = 20,
}: ChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: 8,
        paddingHorizontal: contentPaddingHorizontal,
        paddingVertical: 4,
      }}
    >
      {children}
    </ScrollView>
  );
}
