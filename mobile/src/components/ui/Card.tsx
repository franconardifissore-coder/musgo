/**
 * Card: superficie blanca con bordes redondeados.
 *
 * Variantes:
 * - flat: sin sombra, borde sutil. Para listas densas.
 * - default: sombra xs. Default.
 * - elevated: sombra sm. Para cards "destacadas" (dashboard, hero).
 * - sunken: fondo más suave, sin sombra ni borde. Para contenedores
 *   internos dentro de otra superficie.
 */

import type { ReactNode } from 'react';
import { Box, type BoxProps } from '@/components/primitives/Box';
import type { RadiusToken } from '@/theme/tokens';

export type CardVariant = 'flat' | 'default' | 'elevated' | 'sunken';

export interface CardProps extends Omit<BoxProps, 'bg' | 'shadow' | 'borderColor' | 'borderWidth'> {
  variant?: CardVariant;
  radius?: RadiusToken;
  children: ReactNode;
}

export function Card({
  variant = 'default',
  radius = 'lg',
  p = '5',
  children,
  ...rest
}: CardProps) {
  if (variant === 'sunken') {
    return (
      <Box {...rest} bg="surfaceSunken" radius={radius} p={p}>
        {children}
      </Box>
    );
  }

  if (variant === 'flat') {
    return (
      <Box
        {...rest}
        bg="surface"
        radius={radius}
        p={p}
        borderColor="borderSubtle"
        borderWidth={1}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      {...rest}
      bg="surface"
      radius={radius}
      p={p}
      shadow={variant === 'elevated' ? 'sm' : 'xs'}
      borderColor="borderCard"
      borderWidth={1}
    >
      {children}
    </Box>
  );
}
