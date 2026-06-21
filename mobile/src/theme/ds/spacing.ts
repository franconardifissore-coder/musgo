// ============================================================
// MUSGO Design System — Spacing, Radii & Motion
// Auto-derived from tokens/spacing.css
// ============================================================

// ---- Spacing (4px base grid) ----

export const spacing = {
  s0:  0,
  s1:  4,
  s2:  8,
  s3:  12,
  s4:  16,
  s5:  20,
  s6:  24,
  s7:  32,
  s8:  40,
  s9:  48,
  s10: 64,
  s11: 80,
  s12: 96,
  s13: 128,
} as const;

export type SpacingKey = keyof typeof spacing;

// ---- Border radii ----

export const radii = {
  xs:     4,
  sm:     6,
  md:     10,
  card:   8,   // plant / content cards
  lg:     14,
  xl:     20,
  xxl:    26,
  pill:   9999,
  full:   9999, // alias
} as const;

export type RadiiKey = keyof typeof radii;

// ---- Shadows ----
// React Native requires separate iOS and Android shadow props.
// Wrap your View in the helper or spread ios/android directly.

export interface ShadowStyle {
  // iOS
  shadowColor:   string;
  shadowOffset:  { width: number; height: number };
  shadowOpacity: number;
  shadowRadius:  number;
  // Android
  elevation: number;
}

const SHADOW_COLOR = '#16291f'; // forest-900

export const shadows: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', ShadowStyle> = {
  xs: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  2,
    elevation:     1,
  },
  sm: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  12,
    elevation:     4,
  },
  lg: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius:  20,
    elevation:     8,
  },
  xl: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius:  32,
    elevation:     16,
  },
};

// ---- Motion ----
// Duration in ms; easing curves as string keys for Animated / Reanimated.

export const duration = {
  fast: 140,
  base: 240,
  slow: 420,
} as const;

/**
 * Easing presets — compatible with React Native's Easing module
 * and Reanimated's withTiming / withSpring.
 *
 * @example
 *   withTiming(1, { duration: duration.base, easing: Easing.bezier(...easing.soft) })
 */
export const easing = {
  /** Standard deceleration — most transitions */
  out:    [0.22, 0.61, 0.36, 1]    as [number, number, number, number],
  /** Material-style balanced curve */
  soft:   [0.4,  0,    0.2,  1]    as [number, number, number, number],
  /** Springy overshoot — entrances, celebrate moments */
  spring: [0.34, 1.4,  0.64, 1]    as [number, number, number, number],
} as const;

// ---- Z-index ----

export const zIndex = {
  base:    1,
  sticky:  100,
  overlay: 500,
  modal:   1000,
  toast:   1500,
} as const;

// ---- Layout ----

export const layout = {
  appWidth: 390, // mobile design width (iPhone 14 base)
} as const;
