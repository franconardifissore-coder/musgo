/**
 * Design tokens de Musgo mobile — v2.
 * Sincronizados con el Design System oficial (mobile/Design System/musgo-theme).
 *
 * Paleta: Moss (verde primario), Sprout (acento), Forest (superficies oscuras),
 * Stone (neutros cálidos), Amber (warning), Brick (danger), Water (info).
 * Tipografía: TikTok Sans (Regular → ExtraBold).
 * Grid: 4px base.
 *
 * La API exportada (lightColors, typography, spacing, radii, shadows, motion,
 * layout, fonts) se mantiene estable para no romper consumidores existentes.
 */

import { type TextStyle } from 'react-native';

// ─── Paleta raw ───────────────────────────────────────────────────────────────

const palette = {
  white: '#ffffff',
  black: '#000000',

  // Moss — verde primario
  moss50:  '#eaf4ee',
  moss100: '#cfe7d8',
  moss200: '#a6d2b7',
  moss300: '#71b68c',
  moss400: '#3e9a66',
  moss500: '#1f8a5b', // acción primaria
  moss600: '#15724a',
  moss700: '#115b3c',
  moss800: '#0e4530',
  moss900: '#0a2e20',

  // Forest — texto y superficies oscuras
  forest900: '#16291f',
  forest800: '#1d3527',
  forest700: '#25422f',
  forest600: '#34543d',

  // Sprout — acento secundario
  sprout50:  '#f4fbe9',
  sprout100: '#e8f7cf',
  sprout200: '#d6f1aa',
  sprout300: '#bfe583',
  sprout400: '#a5d35a',
  sprout500: '#8bbf3c',
  sprout600: '#6f9e2a',
  sprout700: '#557b1e',

  // Stone — neutros cálidos
  stone50:  '#f6f6f4',
  stone100: '#eeeeec',
  stone200: '#e3e3df',
  stone300: '#d0d1cc',
  stone400: '#abaca6',
  stone500: '#82847e',
  stone600: '#62645e',
  stone700: '#494b46',
  stone800: '#33342f',
  stone900: '#1f211d',

  // Water — info
  water100: '#d0e9f8',
  water300: '#68b4ea',
  water500: '#2a8fd4',

  // Amber — warning
  amber300: '#f7c96c',
  amber500: '#e88f0a',

  // Brick — danger
  brick500: '#b8463a',
  brick600: '#9a392f',

  // Superficies base
  appBg:  '#ffffff',
  raised: '#fbfbfa',
  sunken: '#ededeb',
} as const;

// ─── Colores semánticos ───────────────────────────────────────────────────────
// Nombres estables para los consumidores (useTheme().colors.*).

export const lightColors = {
  // Brand
  brand:           palette.moss500,
  brandMuted:      palette.moss400,
  brandSoft:       palette.moss50,
  brandSoftText:   palette.moss700,
  brandSoftBorder: palette.moss100,
  brandWash:       palette.sprout50,

  // Secondary (Moss 300)
  secondary:       palette.moss300,

  // Superficies
  bg:              palette.appBg,
  surface:         palette.white,
  surfaceInput:    '#f9fbf8',
  surfaceSunken:   palette.sunken,
  surfaceInverted: palette.forest900,

  // Texto
  text:         '#33352f',
  textMuted:    '#6b6d67',
  textFaint:    '#9a9c95',
  textInverted: palette.white,
  textOnBrand:  palette.white,
  textOnAccent: '#33521b',
  textLink:     palette.moss600,

  // Bordes
  borderSubtle: 'rgba(31, 33, 29, 0.07)',
  border:       'rgba(31, 33, 29, 0.12)',
  borderStrong: 'rgba(31, 33, 29, 0.20)',
  borderCard:   '#f7f7f7',
  borderInput:  'rgba(52, 93, 76, 0.14)',

  // Feedback
  danger:      palette.brick500,
  dangerSoft:  '#f4dcd7',
  success:     palette.moss500,
  successSoft: palette.moss50,
  warning:     palette.amber500,
  warningSoft: '#fdedc8',
  info:        palette.water500,
  infoSoft:    palette.water100,

  // Especiales
  overlay: 'rgba(22, 41, 31, 0.45)',
  shadow:  palette.forest900,
} as const;

export type ColorTokens = typeof lightColors;
export type ColorToken = keyof ColorTokens;

// ─── Fuentes ──────────────────────────────────────────────────────────────────
// Las claves de Font.loadAsync en _layout.tsx deben coincidir con estos valores.

export const fonts = {
  regular:   'TikTokSans-Regular',
  medium:    'TikTokSans-Medium',
  semibold:  'TikTokSans-SemiBold',
  bold:      'TikTokSans-Bold',
  extrabold: 'TikTokSans-ExtraBold',
} as const;

const fontWeights = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
} as const satisfies Record<string, TextStyle['fontWeight']>;

// ─── Tipografía ───────────────────────────────────────────────────────────────

export const typography = {
  display: {
    fontFamily:    fonts.bold,
    fontWeight:    fontWeights.bold,
    fontSize:      46,
    lineHeight:    50,
    letterSpacing: -0.92,
  },
  title: {
    fontFamily:    fonts.bold,
    fontWeight:    fontWeights.bold,
    fontSize:      36,
    lineHeight:    40,
    letterSpacing: -0.72,
  },
  h1: {
    fontFamily:    fonts.bold,
    fontWeight:    fontWeights.bold,
    fontSize:      28,
    lineHeight:    34,
    letterSpacing: -0.56,
  },
  h2: {
    fontFamily:    fonts.semibold,
    fontWeight:    fontWeights.semibold,
    fontSize:      22,
    lineHeight:    27,
    letterSpacing: -0.22,
  },
  h3: {
    fontFamily:    fonts.semibold,
    fontWeight:    fontWeights.semibold,
    fontSize:      18,
    lineHeight:    22,
    letterSpacing: -0.18,
  },
  bodyLarge: {
    fontFamily:    fonts.regular,
    fontWeight:    fontWeights.regular,
    fontSize:      18,
    lineHeight:    29,
    letterSpacing: 0,
  },
  body: {
    fontFamily:    fonts.regular,
    fontWeight:    fontWeights.regular,
    fontSize:      16,
    lineHeight:    23,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily:    fonts.medium,
    fontWeight:    fontWeights.medium,
    fontSize:      16,
    lineHeight:    23,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily:    fonts.regular,
    fontWeight:    fontWeights.regular,
    fontSize:      14,
    lineHeight:    20,
    letterSpacing: 0,
  },
  label: {
    fontFamily:    fonts.semibold,
    fontWeight:    fontWeights.semibold,
    fontSize:      12,
    lineHeight:    16,
    letterSpacing: 1.68,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily:    fonts.regular,
    fontWeight:    fontWeights.regular,
    fontSize:      13,
    lineHeight:    19,
    letterSpacing: 0,
  },
  button: {
    fontFamily:    fonts.semibold,
    fontWeight:    fontWeights.semibold,
    fontSize:      16,
    lineHeight:    20,
    letterSpacing: 0,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

// ─── Espaciado (grid de 4px) ──────────────────────────────────────────────────

export const spacing = {
  none: 0,
  '1':   4,
  '2':   8,
  '3':  12,
  '4':  16,
  '5':  20,
  '6':  24,
  '7':  32,
  '8':  40,
  '9':  48,
  '10': 64,
  '11': 80,
  '12': 96,
} as const;

export type SpacingToken = keyof typeof spacing;

// ─── Radii ────────────────────────────────────────────────────────────────────

export const radii = {
  none: 0,
  xs:   4,
  sm:   6,
  md:   10,
  card: 8,
  lg:   14,
  xl:   20,
  xxl:  26,
  pill: 9999,
} as const;

export type RadiusToken = keyof typeof radii;

// ─── Sombras ──────────────────────────────────────────────────────────────────

export const shadows = {
  none: {
    shadowColor:   'transparent',
    shadowOpacity: 0,
    shadowRadius:  0,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     0,
  },
  xs: {
    shadowColor:   palette.forest900,
    shadowOpacity: 0.10,
    shadowRadius:  6,
    shadowOffset:  { width: 0, height: 2 },
    elevation:     3,
  },
  sm: {
    shadowColor:   palette.forest900,
    shadowOpacity: 0.13,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     5,
  },
  md: {
    shadowColor:   palette.forest900,
    shadowOpacity: 0.10,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     4,
  },
  lg: {
    shadowColor:   palette.forest900,
    shadowOpacity: 0.14,
    shadowRadius:  20,
    shadowOffset:  { width: 0, height: 8 },
    elevation:     8,
  },
} as const;

export type ShadowToken = keyof typeof shadows;

// ─── Motion ───────────────────────────────────────────────────────────────────

export const motion = {
  duration: {
    fast: 140,
    base: 240,
    slow: 420,
    page: 280,
  },
  easing: {
    standard:   [0.22, 0.61, 0.36, 1] as const,
    decelerate: [0,    0,    0.2,  1] as const,
    accelerate: [0.4,  0,    1,    1] as const,
  },
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const layout = {
  screen: {
    paddingHorizontal: spacing['5'],
    paddingTop:        spacing['4'],
    paddingBottom:     spacing['8'],
  },
  hitSlop:     { top: 8, right: 8, bottom: 8, left: 8 },
  touchTarget: 44,
  appWidth:    390,
} as const;

// ─── Theme bundle ─────────────────────────────────────────────────────────────

export const lightTheme = {
  name: 'light' as const,
  colors:     lightColors,
  fonts,
  typography,
  spacing,
  radii,
  shadows,
  motion,
  layout,
};

export type Theme = typeof lightTheme;
