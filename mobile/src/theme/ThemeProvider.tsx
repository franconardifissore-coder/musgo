/**
 * ThemeProvider: expone el theme actual a toda la app vía contexto.
 *
 * Hoy solo existe `light`. La arquitectura está preparada para que un futuro
 * dark mode se enchufe acá (con `useColorScheme()` o toggle manual) sin
 * tocar a los consumidores.
 *
 * Patrón de uso:
 *   const { colors, spacing, typography } = useTheme();
 *
 * Y para componentes que necesiten reaccionar a cambios:
 *   const theme = useTheme();
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { lightTheme, type Theme } from './tokens';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Aunque ahora siempre devolvemos lightTheme, lo memoizamos para no
  // crear nuevas refs en cada render del root.
  const theme = useMemo(() => lightTheme, []);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
