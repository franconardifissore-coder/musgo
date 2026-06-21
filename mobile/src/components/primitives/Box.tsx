/**
 * Box: View tipado con props de spacing / radius / bg / border que mapean a
 * tokens del theme. Permite "atomic styling" sin librería ni hex hardcoded.
 *
 *   <Box bg="surface" p="4" radius="md" gap="3">
 *     <Text>contenido</Text>
 *   </Box>
 *
 * Mantiene compatibilidad con `style` para casos donde haga falta un valor
 * crudo (raro, pero el escape hatch existe).
 */

import { View, type ViewProps, type ViewStyle, type FlexAlignType } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorToken, RadiusToken, ShadowToken, SpacingToken } from '@/theme/tokens';

type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

export interface BoxProps extends ViewProps {
  // Spacing
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pb?: SpacingToken;
  pl?: SpacingToken;
  pr?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  mt?: SpacingToken;
  mb?: SpacingToken;
  ml?: SpacingToken;
  mr?: SpacingToken;
  gap?: SpacingToken;

  // Background / color
  bg?: ColorToken;

  // Border
  borderColor?: ColorToken;
  borderWidth?: number;
  borderTopWidth?: number;
  borderBottomWidth?: number;
  radius?: RadiusToken;

  // Shadow
  shadow?: ShadowToken;

  // Layout shorthands
  flex?: number;
  direction?: FlexDirection;
  align?: FlexAlignType;
  justify?: ViewStyle['justifyContent'];
  wrap?: ViewStyle['flexWrap'];
}

export function Box({
  p,
  px,
  py,
  pt,
  pb,
  pl,
  pr,
  m,
  mx,
  my,
  mt,
  mb,
  ml,
  mr,
  gap,
  bg,
  borderColor,
  borderWidth,
  borderTopWidth,
  borderBottomWidth,
  radius,
  shadow,
  flex,
  direction,
  align,
  justify,
  wrap,
  style,
  ...rest
}: BoxProps) {
  const theme = useTheme();
  const composed: ViewStyle = {};

  if (p !== undefined) composed.padding = theme.spacing[p];
  if (px !== undefined) composed.paddingHorizontal = theme.spacing[px];
  if (py !== undefined) composed.paddingVertical = theme.spacing[py];
  if (pt !== undefined) composed.paddingTop = theme.spacing[pt];
  if (pb !== undefined) composed.paddingBottom = theme.spacing[pb];
  if (pl !== undefined) composed.paddingLeft = theme.spacing[pl];
  if (pr !== undefined) composed.paddingRight = theme.spacing[pr];

  if (m !== undefined) composed.margin = theme.spacing[m];
  if (mx !== undefined) composed.marginHorizontal = theme.spacing[mx];
  if (my !== undefined) composed.marginVertical = theme.spacing[my];
  if (mt !== undefined) composed.marginTop = theme.spacing[mt];
  if (mb !== undefined) composed.marginBottom = theme.spacing[mb];
  if (ml !== undefined) composed.marginLeft = theme.spacing[ml];
  if (mr !== undefined) composed.marginRight = theme.spacing[mr];

  if (gap !== undefined) composed.gap = theme.spacing[gap];

  if (bg !== undefined) composed.backgroundColor = theme.colors[bg];

  if (borderColor !== undefined) composed.borderColor = theme.colors[borderColor];
  if (borderWidth !== undefined) composed.borderWidth = borderWidth;
  if (borderTopWidth !== undefined) composed.borderTopWidth = borderTopWidth;
  if (borderBottomWidth !== undefined) composed.borderBottomWidth = borderBottomWidth;
  if (radius !== undefined) composed.borderRadius = theme.radii[radius];

  if (flex !== undefined) composed.flex = flex;
  if (direction !== undefined) composed.flexDirection = direction;
  if (align !== undefined) composed.alignItems = align;
  if (justify !== undefined) composed.justifyContent = justify;
  if (wrap !== undefined) composed.flexWrap = wrap;

  const shadowStyle = shadow ? theme.shadows[shadow] : null;

  return <View {...rest} style={[composed, shadowStyle, style]} />;
}
