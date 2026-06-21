// ============================================================
// MUSGO Design System — Main entry point
// ============================================================
//
// Usage:
//   import { theme } from './musgo-theme';
//   import { useMusgoTheme } from './musgo-theme';
//
// Or cherry-pick:
//   import { colors, spacing, textStyles } from './musgo-theme';
//
// ============================================================

export { palette, colors }           from './colors';
export { fonts, fontWeights, fontSize, lineHeight,
         letterSpacingEm, letterSpacingFor,
         textStyles }                from './typography';
export { spacing, radii, shadows,
         duration, easing, zIndex,
         layout }                    from './spacing';

export type { Colors, Palette }      from './colors';
export type { TextStyleKey }         from './typography';
export type { SpacingKey, RadiiKey, ShadowStyle } from './spacing';

// ---- Composed theme object ----
// Useful when passing the whole theme through React context.

import { palette, colors }  from './colors';
import { fonts, fontWeights, fontSize, lineHeight,
         letterSpacingEm, letterSpacingFor,
         textStyles }        from './typography';
import { spacing, radii, shadows,
         duration, easing, zIndex,
         layout }            from './spacing';

export const theme = {
  palette,
  colors,
  fonts,
  fontWeights,
  fontSize,
  lineHeight,
  letterSpacingEm,
  letterSpacingFor,
  textStyles,
  spacing,
  radii,
  shadows,
  duration,
  easing,
  zIndex,
  layout,
} as const;

export type Theme = typeof theme;

// ---- React context hook (optional) ----
// Wrap your app in <MusgoThemeProvider> and call useMusgoTheme()
// anywhere to access the theme without prop-drilling.
//
// SETUP — add to your app root (App.tsx or _layout.tsx):
//
//   import { MusgoThemeProvider } from './musgo-theme';
//   export default function App() {
//     return (
//       <MusgoThemeProvider>
//         <YourApp />
//       </MusgoThemeProvider>
//     );
//   }

import React, { createContext, useContext } from 'react';

const MusgoThemeContext = createContext<Theme>(theme);

export function MusgoThemeProvider({
  children,
  value = theme,
}: {
  children: React.ReactNode;
  value?: Theme;
}) {
  return (
    <MusgoThemeContext.Provider value={value}>
      {children}
    </MusgoThemeContext.Provider>
  );
}

export function useMusgoTheme(): Theme {
  return useContext(MusgoThemeContext);
}
