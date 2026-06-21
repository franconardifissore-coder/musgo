/**
 * BackPill: botón "atrás" estilo píldora para headers de Stack.
 *
 * Réplica nativa de `.screen-back` (web): pill translúcida con chevron +
 * label opcional. Se usa como `headerLeft` en pantallas con header propio,
 * reemplazando el back button nativo para mantener consistencia visual.
 */

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';

export interface BackPillProps {
  /** Texto a mostrar junto al chevron (ej. "Plantas", "Espacios"). */
  label?: string;
  onPress: () => void;
}

export function BackPill({ label, onPress }: BackPillProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ? `Volver a ${label}` : 'Volver'}
      hitSlop={theme.layout.hitSlop}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 40,
        paddingHorizontal: 14,
        borderRadius: theme.radii.pill,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        marginLeft: 4,
      }}
    >
      <Text style={{ fontSize: 20, lineHeight: 20, color: theme.colors.text, fontWeight: '700' }}>
        ‹
      </Text>
      {label ? (
        <Text variant="bodySmall" weight="700" color="text">
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
