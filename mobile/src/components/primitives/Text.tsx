/**
 * Componente Text tipado con variantes de typography del theme.
 *
 * Ventaja sobre el Text crudo de RN: aplica fontFamily, fontSize, lineHeight,
 * letterSpacing y weight de una sola prop `variant`. También soporta `color`
 * por token semántico (no por hex).
 *
 *   <Text variant="title">Hola</Text>
 *   <Text variant="body" color="textMuted">subtítulo</Text>
 */

import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorToken, TypographyVariant } from '@/theme/tokens';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
  /** Override de peso si hace falta. */
  weight?: TextStyle['fontWeight'];
}

export function Text({
  variant = 'body',
  color = 'text',
  align,
  weight,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const variantStyle = theme.typography[variant];
  return (
    <RNText
      {...rest}
      style={[
        variantStyle,
        { color: theme.colors[color] },
        align ? { textAlign: align } : null,
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    />
  );
}
