// ============================================================
// MUSGO Design System — Typography
// Auto-derived from tokens/typography.css & tokens/fonts.css
//
// FONT SETUP (Expo)
// -----------------
// TikTok Sans is the sole typeface across display, headings,
// UI text, and numerals. Download the .ttf files from Google
// Fonts (fonts.google.com/specimen/TikTok+Sans) and add them
// to your assets/fonts/ folder, then load via expo-font:
//
//   import * as Font from 'expo-font';
//   await Font.loadAsync({
//     'TikTokSans-Light':    require('./assets/fonts/TikTokSans-Light.ttf'),
//     'TikTokSans-Regular':  require('./assets/fonts/TikTokSans-Regular.ttf'),
//     'TikTokSans-Medium':   require('./assets/fonts/TikTokSans-Medium.ttf'),
//     'TikTokSans-SemiBold': require('./assets/fonts/TikTokSans-SemiBold.ttf'),
//     'TikTokSans-Bold':     require('./assets/fonts/TikTokSans-Bold.ttf'),
//     'TikTokSans-ExtraBold':require('./assets/fonts/TikTokSans-ExtraBold.ttf'),
//   });
//
// Then use fontFamily: fonts.light / fonts.regular / etc.
// ============================================================

// ---- Font family names (must match Font.loadAsync keys) ----

export const fonts = {
  light:     'TikTokSans-Light',
  regular:   'TikTokSans-Regular',
  medium:    'TikTokSans-Medium',
  semiBold:  'TikTokSans-SemiBold',
  bold:      'TikTokSans-Bold',
  extraBold: 'TikTokSans-ExtraBold',
} as const;

// ---- Font weights (numeric — for platforms that resolve by weight) ----

export const fontWeights = {
  light:     '300',
  regular:   '400',
  medium:    '500',
  semiBold:  '600',
  bold:      '700',
  extraBold: '800',
} as const;

// ---- Type scale (px → unitless numbers for React Native) ----

export const fontSize = {
  displayXl: 60,
  display:   46,
  h1:        36,
  h2:        28,
  h3:        22,
  title:     18,
  bodyLg:    18,
  body:      16,
  bodySm:    14,
  caption:   13,
  overline:  12,
} as const;

// ---- Line heights (multipliers — multiply by fontSize) ----

export const lineHeight = {
  tight:   1.08,
  snug:    1.22,
  normal:  1.45,
  relaxed: 1.62,
} as const;

// ---- Letter spacing (em values — use letterSpacingFor() helper) ----
// React Native letterSpacing is in points (absolute), not em (relative).
// Use the helper below to resolve per text size, or use the presets.

export const letterSpacingEm = {
  tight:    -0.02,
  snug:     -0.01,
  normal:    0,
  wide:      0.04,
  overline:  0.14,
} as const;

/**
 * Resolve a relative letter-spacing (em) to an absolute point value
 * suitable for React Native's `letterSpacing` style prop.
 *
 * @example
 *   letterSpacingFor('tight', fontSize.h1) // → -0.72
 */
export function letterSpacingFor(
  key: keyof typeof letterSpacingEm,
  size: number,
): number {
  return letterSpacingEm[key] * size;
}

// ---- Pre-built text style presets ----
// Use these directly in StyleSheet.create() or as spread props.

export const textStyles = {
  displayXl: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.displayXl,
    lineHeight:    Math.round(fontSize.displayXl * lineHeight.tight),
    letterSpacing: letterSpacingFor('tight', fontSize.displayXl),
  },
  display: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.display,
    lineHeight:    Math.round(fontSize.display * lineHeight.tight),
    letterSpacing: letterSpacingFor('tight', fontSize.display),
  },
  h1: {
    fontFamily:    fonts.bold,
    fontSize:      fontSize.h1,
    lineHeight:    Math.round(fontSize.h1 * lineHeight.snug),
    letterSpacing: letterSpacingFor('tight', fontSize.h1),
  },
  h2: {
    fontFamily:    fonts.semiBold,
    fontSize:      fontSize.h2,
    lineHeight:    Math.round(fontSize.h2 * lineHeight.snug),
    letterSpacing: letterSpacingFor('tight', fontSize.h2),
  },
  h3: {
    fontFamily:    fonts.semiBold,
    fontSize:      fontSize.h3,
    lineHeight:    Math.round(fontSize.h3 * lineHeight.snug),
    letterSpacing: letterSpacingFor('snug', fontSize.h3),
  },
  title: {
    fontFamily:    fonts.semiBold,
    fontSize:      fontSize.title,
    lineHeight:    Math.round(fontSize.title * lineHeight.normal),
    letterSpacing: letterSpacingFor('normal', fontSize.title),
  },
  bodyLg: {
    fontFamily:    fonts.regular,
    fontSize:      fontSize.bodyLg,
    lineHeight:    Math.round(fontSize.bodyLg * lineHeight.relaxed),
    letterSpacing: letterSpacingFor('normal', fontSize.bodyLg),
  },
  body: {
    fontFamily:    fonts.regular,
    fontSize:      fontSize.body,
    lineHeight:    Math.round(fontSize.body * lineHeight.normal),
    letterSpacing: letterSpacingFor('normal', fontSize.body),
  },
  bodySm: {
    fontFamily:    fonts.regular,
    fontSize:      fontSize.bodySm,
    lineHeight:    Math.round(fontSize.bodySm * lineHeight.normal),
    letterSpacing: letterSpacingFor('normal', fontSize.bodySm),
  },
  caption: {
    fontFamily:    fonts.regular,
    fontSize:      fontSize.caption,
    lineHeight:    Math.round(fontSize.caption * lineHeight.normal),
    letterSpacing: letterSpacingFor('normal', fontSize.caption),
  },
  overline: {
    fontFamily:    fonts.semiBold,
    fontSize:      fontSize.overline,
    lineHeight:    Math.round(fontSize.overline * lineHeight.normal),
    letterSpacing: letterSpacingFor('overline', fontSize.overline),
    textTransform: 'uppercase' as const,
  },
  numericLg: {
    fontFamily:    fonts.semiBold,
    fontSize:      34,
    lineHeight:    Math.round(34 * lineHeight.tight),
    letterSpacing: letterSpacingFor('snug', 34),
  },
  numericSm: {
    fontFamily:    fonts.medium,
    fontSize:      fontSize.bodySm,
    lineHeight:    Math.round(fontSize.bodySm * lineHeight.normal),
    letterSpacing: letterSpacingFor('normal', fontSize.bodySm),
  },
} as const;

export type TextStyleKey = keyof typeof textStyles;
