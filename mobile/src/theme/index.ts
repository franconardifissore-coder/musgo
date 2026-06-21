/**
 * Barrel del módulo theme. Punto de entrada estable para los consumidores.
 *
 * Uso principal (hook):
 *   import { useTheme } from '@/theme';
 *   const { colors, spacing, typography } = useTheme();
 *
 * DS raw (paleta completa, tokens primitivos):
 *   import { theme as ds } from '@/theme/ds';
 */
export { ThemeProvider, useTheme } from './ThemeProvider';
export {
  lightTheme,
  lightColors,
  typography,
  fonts,
  spacing,
  radii,
  shadows,
  motion,
  layout,
  type Theme,
  type ColorTokens,
  type ColorToken,
  type TypographyVariant,
  type SpacingToken,
  type RadiusToken,
  type ShadowToken,
} from './tokens';
