/**
 * Wrappers de gradients del DS Musgo:
 *
 * - GradientBrandSoft: top→bottom white → stone50. Cards héroe (auth, profile,
 *   scan box, dashboard summary).
 * - GradientBrandCta: left→right moss600 → moss400. CTAs primarios destacados
 *   (alternativa al sólido, úsalo con criterio).
 * - GradientForest: top→bottom forest900 → forest700. Overlays oscuros sobre
 *   fotos de plantas.
 *
 * Construidos sobre `expo-linear-gradient`. Para otros gradients, importá
 * LinearGradient directamente.
 */

import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import type { StyleProp, ViewStyle } from 'react-native';

// Paleta alineada con musgo-theme DS
const SOFT_COLORS  = ['#ffffff', '#f6f6f4'] as const; // white → stone50
const CTA_COLORS   = ['#15724a', '#3e9a66'] as const; // moss600 → moss400
const FOREST_COLORS = ['#16291f', '#25422f'] as const; // forest900 → forest700

interface BaseProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function GradientBrandSoft({ children, style }: BaseProps) {
  return (
    <LinearGradient
      colors={SOFT_COLORS as unknown as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

export function GradientBrandCta({ children, style }: BaseProps) {
  return (
    <LinearGradient
      colors={CTA_COLORS as unknown as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

export function GradientForest({ children, style }: BaseProps) {
  return (
    <LinearGradient
      colors={FOREST_COLORS as unknown as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
