// ============================================================
// MUSGO Design System — Colors
// Auto-derived from tokens/colors.css
// ============================================================

// ---- Raw palette ----

export const palette = {
  // Brand
  brandEmerald: '#00a880',

  // Moss (primary green)
  moss50:  '#eaf4ee',
  moss100: '#cfe7d8',
  moss200: '#a6d2b7',
  moss300: '#71b68c',
  moss400: '#3e9a66',
  moss500: '#1f8a5b', // primary action
  moss600: '#15724a',
  moss700: '#115b3c',
  moss800: '#0e4530',
  moss900: '#0a2e20',

  // Forest (deep greens — text & dark surfaces)
  forest900: '#16291f',
  forest800: '#1d3527',
  forest700: '#25422f',
  forest600: '#34543d',

  // Sprout (secondary accent — fresh growth)
  sprout50:  '#f4fbe9',
  sprout100: '#e8f7cf',
  sprout200: '#d6f1aa', // chosen accent fill
  sprout300: '#bfe583',
  sprout400: '#a5d35a',
  sprout500: '#8bbf3c',
  sprout600: '#6f9e2a',
  sprout700: '#557b1e',
  sprout800: '#415d18',
  sprout900: '#2c3f12',

  // Water (hydration / info cues only)
  water100: '#d0e9f8',
  water300: '#68b4ea',
  water500: '#2a8fd4',
  water700: '#1a5e96',

  // Stone (warm neutral ramp)
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

  // Amber (warning)
  amber300: '#f7c96c',
  amber400: '#f2aa2a',
  amber500: '#e88f0a',

  // Brick (danger / thirsty)
  brick500: '#b8463a',
  brick600: '#9a392f',

  // Base surfaces
  white:  '#ffffff',
  appBg:  '#f6f6f4',
  raised: '#fbfbfa',
  sunken: '#ededeb',
} as const;

// ---- Semantic tokens ----

export const colors = {
  // Status
  success:   palette.moss500,
  successBg: palette.moss50,
  warning:   palette.amber500,
  warningBg: '#fdedc8',
  danger:    palette.brick500,
  dangerBg:  '#f4dcd7',
  info:      palette.water500,
  infoBg:    '#d0e9f8',

  // Surfaces
  surfaceApp:        palette.appBg,
  surfaceCard:       palette.white,
  surfaceRaised:     palette.raised,
  surfaceSunken:     palette.sunken,
  surfaceInverse:    palette.forest900,
  surfaceBrand:      palette.moss500,
  surfaceBrandSoft:  palette.moss50,
  surfaceAccentSoft: palette.sprout100,

  // Text
  textStrong:   palette.stone900,
  textBody:     '#33352f',
  textMuted:    '#6b6d67',
  textFaint:    '#9a9c95',
  textOnBrand:  '#ffffff',
  textOnAccent: '#33521b',
  textOnDark:   '#eef0ea',
  textBrand:    palette.moss600,
  textAccent:   palette.sprout700,
  textLink:     palette.moss600,

  // Borders
  borderSoft:    'rgba(31, 33, 29, 0.07)',
  borderDefault: 'rgba(31, 33, 29, 0.12)',
  borderStrong:  'rgba(31, 33, 29, 0.20)',
  borderBrand:   palette.moss300,

  // Interactive
  actionPrimary:      palette.moss500,
  actionPrimaryHover: palette.moss600,
  actionPrimaryPress: palette.moss700,
  actionAccent:       palette.sprout200,
  actionAccentHover:  palette.sprout300,
  actionAccentPress:  palette.sprout400,

  focusRing: 'rgba(31, 138, 91, 0.40)',
} as const;

export type Colors = typeof colors;
export type Palette = typeof palette;
