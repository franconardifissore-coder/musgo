/**
 * Botón icon-only de 44x44 (touch target nativo).
 *
 * Variantes:
 * - default: superficie blanca con borde sutil. Acciones de toolbar.
 * - ghost: sin fondo. Headers, navegación.
 * - filled: fondo brand. Acción primaria compacta.
 * - danger: borde + icono danger. Eliminar inline.
 */

import { type ViewStyle } from 'react-native';
import { Pressable, type PressableProps } from '@/components/primitives/Pressable';
import { useTheme } from '@/theme/ThemeProvider';

export type IconButtonVariant = 'default' | 'ghost' | 'filled' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  accessibilityLabel: string;
}

const sizeMap: Record<IconButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

export function IconButton({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  accessibilityLabel,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const dim = sizeMap[size];

  const style: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  if (variant === 'default') {
    style.backgroundColor = theme.colors.surface;
    style.borderWidth = 1;
    style.borderColor = theme.colors.border;
  } else if (variant === 'filled') {
    style.backgroundColor = theme.colors.brand;
    Object.assign(style, theme.shadows.sm);
  } else if (variant === 'danger') {
    style.backgroundColor = theme.colors.surface;
    style.borderWidth = 1;
    style.borderColor = theme.colors.danger;
  }
  // ghost: sin fondo ni borde

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={theme.layout.hitSlop}
      style={style}
    >
      {children}
    </Pressable>
  );
}
