/**
 * Botón base con 4 variantes y 3 tamaños.
 *
 * Variantes:
 * - primary: fondo brand, texto sobre-brand, sombra sutil. CTA principal.
 * - secondary: fondo surface, borde sutil. Acciones secundarias.
 * - danger: fondo surface, borde + texto danger. Confirmaciones destructivas.
 * - ghost: sin fondo ni borde. Acciones inline / cancelar.
 *
 * Tamaños: sm (40px), md (52px, default), lg (60px).
 *
 * No replica los 64px del CSS web — recalibrado a feel nativo.
 */

import { ActivityIndicator, type ViewStyle, View } from 'react-native';
import { Pressable, type PressableProps } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorToken } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'brandSoft' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Slot a la izquierda del label (icono, emoji). */
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeMap: Record<ButtonSize, { height: number; paddingHorizontal: number }> = {
  sm: { height: 40, paddingHorizontal: 16 },
  md: { height: 52, paddingHorizontal: 22 },
  lg: { height: 60, paddingHorizontal: 28 },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftSlot,
  rightSlot,
  fullWidth = false,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const { height, paddingHorizontal } = sizeMap[size];

  const variantBg: Record<ButtonVariant, ColorToken | 'transparent'> = {
    primary:    'brand',
    secondary:  'surface',
    brandSoft:  'brandSoft',
    danger:     'surface',
    ghost:      'surface',
  };
  const variantText: Record<ButtonVariant, ColorToken> = {
    primary:    'textOnBrand',
    secondary:  'text',
    brandSoft:  'brandSoftText',
    danger:     'danger',
    ghost:      'textLink',
  };
  const variantBorder: Record<ButtonVariant, ColorToken | 'transparent'> = {
    primary:    'transparent',
    secondary:  'border',
    brandSoft:  'brandSoftBorder',
    danger:     'danger',
    ghost:      'transparent',
  };

  const baseStyle: ViewStyle = {
    height,
    paddingHorizontal,
    borderRadius: theme.radii.pill,
    backgroundColor:
      variantBg[variant] === 'transparent'
        ? 'transparent'
        : theme.colors[variantBg[variant] as ColorToken],
    borderWidth: variantBorder[variant] === 'transparent' ? 0 : 1,
    borderColor:
      variantBorder[variant] === 'transparent'
        ? undefined
        : theme.colors[variantBorder[variant] as ColorToken],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['2'],
    opacity: disabled || loading ? 0.55 : 1,
    ...(variant === 'primary' ? theme.shadows.xs : null),
    ...(fullWidth ? { alignSelf: 'stretch' } : null),
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={baseStyle}
    >
      {loading ? (
        <ActivityIndicator
          color={theme.colors[variantText[variant]]}
          size="small"
        />
      ) : (
        <>
          {leftSlot ? <View>{leftSlot}</View> : null}
          <Text variant="button" color={variantText[variant]}>
            {label}
          </Text>
          {rightSlot ? <View>{rightSlot}</View> : null}
        </>
      )}
    </Pressable>
  );
}
