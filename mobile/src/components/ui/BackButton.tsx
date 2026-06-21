/**
 * BackButton: botón "atrás" para headers de pantallas internas.
 *
 * Reemplaza al `BackPill` (que mostraba el nombre de la pantalla destino).
 * Diseño nuevo: solo el icono de flecha, sin label. El título de la pantalla
 * actual lo provee el header del Stack (`headerTitle`).
 */

import { Pressable } from '@/components/primitives/Pressable';
import { BackArrowIcon } from '@/components/icons';
import { useTheme } from '@/theme/ThemeProvider';

export interface BackButtonProps {
  onPress: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={theme.layout.hitSlop}
      style={{
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -6,
      }}
    >
      <BackArrowIcon size={28} color="text" />
    </Pressable>
  );
}
