/**
 * getPlantWaterStatus: deriva un estado descriptivo de la planta para mostrar
 * en cards / listas. Port de `lib/shared-render.js::getPlantWaterStatus`.
 *
 * Estados:
 * - 'no_log'   → la planta nunca se regó. "Sin riegos registrados".
 * - 'overdue'  → días desde último riego > freq. "X días de atraso".
 * - 'today'    → toca regar hoy. "Regar hoy".
 * - 'tomorrow' → toca mañana. "Regar mañana".
 * - 'upcoming' → toca en N días. "Regar en N días".
 *
 * El componente que renderea decide qué icono / color usar a partir del status.
 */

import type { Plant } from './types';
import { daysBetween, lastWatered } from './watering';

export type PlantWaterStatusKind =
  | 'no_log'
  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'upcoming';

export interface PlantWaterStatus {
  kind: PlantWaterStatusKind;
  /** Texto listo para mostrar en español. */
  text: string;
  /** Días desde el último riego (solo válido si hay log). */
  daysSinceLastWater: number | null;
  /** Días hasta el próximo riego (null si no_log u overdue). */
  daysUntilNext: number | null;
}

export function getPlantWaterStatus(plant: Plant): PlantWaterStatus {
  const lw = lastWatered(plant);
  if (!lw) {
    return {
      kind: 'no_log',
      text: 'Sin riegos registrados',
      daysSinceLastWater: null,
      daysUntilNext: null,
    };
  }

  const days = daysBetween(lw);
  const freq = Number(plant.freq) || 3;

  if (days > freq) {
    return {
      kind: 'overdue',
      text: `${days} día${days === 1 ? '' : 's'} de atraso`,
      daysSinceLastWater: days,
      daysUntilNext: null,
    };
  }

  const daysUntilNext = freq - days;
  if (daysUntilNext <= 0) {
    return {
      kind: 'today',
      text: 'Regar hoy',
      daysSinceLastWater: days,
      daysUntilNext: 0,
    };
  }
  if (daysUntilNext === 1) {
    return {
      kind: 'tomorrow',
      text: 'Regar mañana',
      daysSinceLastWater: days,
      daysUntilNext: 1,
    };
  }
  return {
    kind: 'upcoming',
    text: `Regar en ${daysUntilNext} días`,
    daysSinceLastWater: days,
    daysUntilNext,
  };
}
