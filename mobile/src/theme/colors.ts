/**
 * @deprecated Importar desde `@/theme/tokens` o usar `useTheme()` en su lugar.
 *
 * Este módulo existe solo para no romper los imports antiguos durante la
 * transición. Mapea los nombres legacy a los tokens semánticos light del
 * nuevo DS. Se elimina cuando todas las pantallas se hayan refactorizado.
 */

import { lightColors } from './tokens';

export const colors = {
  bg:            lightColors.bg,
  bgElevated:    lightColors.surface,
  textPrimary:   lightColors.text,
  textSecondary: lightColors.textMuted,
  accent:        lightColors.brand,
  accentMuted:   lightColors.brandSoft,
  border:        lightColors.border,
  danger:        lightColors.danger,
  // nuevos tokens disponibles en el shim para migración gradual
  brandSoft:     lightColors.brandSoft,
  brandWash:     lightColors.brandWash,
  textFaint:     lightColors.textFaint,
  textLink:      lightColors.textLink,
  success:       lightColors.success,
  successSoft:   lightColors.successSoft,
  warning:       lightColors.warning,
  warningSoft:   lightColors.warningSoft,
} as const;

export type ColorToken = keyof typeof colors;
