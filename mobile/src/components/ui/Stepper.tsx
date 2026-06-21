/**
 * Stepper numérico: − [valor] +. Más amable en mobile que un input numérico
 * para enteros chicos (freq de riego: 1-60).
 */

import { Box } from '@/components/primitives/Box';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  /** Sufijo del label (ej. "días"). Solo visual. */
  suffix?: string;
  disabled?: boolean;
}

export function Stepper({
  value,
  min = 1,
  max = 60,
  step = 1,
  onChange,
  suffix,
  disabled = false,
}: StepperProps) {
  const theme = useTheme();
  const canDec = value > min && !disabled;
  const canInc = value < max && !disabled;

  function clamp(n: number): number {
    return Math.max(min, Math.min(max, n));
  }

  return (
    <Box
      direction="row"
      align="center"
      justify="space-between"
      px="3"
      py="2"
      bg="surfaceSunken"
      radius="md"
      style={{
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        minHeight: 50,
      }}
    >
      <Pressable
        onPress={() => onChange(clamp(value - step))}
        disabled={!canDec}
        accessibilityRole="button"
        accessibilityLabel="Disminuir"
        hitSlop={theme.layout.hitSlop}
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radii.pill,
          backgroundColor: canDec ? theme.colors.surface : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: canDec ? 1 : 0.4,
          borderWidth: 1,
          borderColor: canDec ? theme.colors.border : 'transparent',
        }}
      >
        <Text variant="h2" color="text">
          −
        </Text>
      </Pressable>

      <Box align="center" flex={1}>
        <Text variant="h1">
          {value}
          {suffix ? <Text variant="bodyMedium" color="textMuted">{` ${suffix}`}</Text> : null}
        </Text>
      </Box>

      <Pressable
        onPress={() => onChange(clamp(value + step))}
        disabled={!canInc}
        accessibilityRole="button"
        accessibilityLabel="Aumentar"
        hitSlop={theme.layout.hitSlop}
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radii.pill,
          backgroundColor: canInc ? theme.colors.brand : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: canInc ? 1 : 0.4,
        }}
      >
        <Text variant="h2" color={canInc ? 'textOnBrand' : 'text'}>
          +
        </Text>
      </Pressable>
    </Box>
  );
}
