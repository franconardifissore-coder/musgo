/**
 * Lógica de riego de Musgo, portada desde lib/domain/watering.js.
 *
 * Diferencias con la versión web:
 * - Funciones puras, sin depender de globalScope / window.
 * - `countPlantsNeedingWaterOnDate` y `getDashboardWaterProjection` reciben
 *   el array de plants como argumento en vez de leerlo de un getState global.
 *   Esto las hace testeables y reutilizables desde cualquier capa.
 */

import type { Plant, DateStr, DashboardWaterProjectionDay } from './types';

const MS_PER_DAY = 86_400_000;

/** Formatea una Date local como YYYY-MM-DD. */
export function formatLocalDate(date: Date): DateStr {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Devuelve la fecha de hoy en formato YYYY-MM-DD según la zona local. */
export function today(): DateStr {
  return formatLocalDate(new Date());
}

/** Parsea YYYY-MM-DD a Date local (no UTC). */
export function parseLocalDate(dateStr: DateStr): Date {
  const parts = String(dateStr).split('-').map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(year, month - 1, day);
}

/** Días enteros entre la fecha dada y hoy (truncando horas). */
export function daysBetween(dateStr: DateStr): number {
  const then = parseLocalDate(dateStr);
  const now = new Date();
  then.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - then.getTime()) / MS_PER_DAY);
}

/** Última fecha de riego de la planta, o null si nunca se regó. */
export function lastWatered(plant: Plant): DateStr | null {
  if (!plant.waterLog || plant.waterLog.length === 0) return null;
  return plant.waterLog.slice().sort().reverse()[0] ?? null;
}

/** True si la planta necesita agua hoy. */
export function needsWater(plant: Plant): boolean {
  const lw = lastWatered(plant);
  if (!lw) return true;
  return daysBetween(lw) >= plant.freq;
}

/** Devuelve una nueva Date con N días sumados (no muta el input). */
export function addDaysToDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Cuántas plantas del array necesitan riego en una fecha dada (no hoy
 * necesariamente, sirve para proyecciones a futuro).
 */
export function countPlantsNeedingWaterOnDate(
  plants: readonly Plant[],
  dateStr: DateStr,
): number {
  const targetDate = parseLocalDate(dateStr);
  return plants.filter((plant) => {
    const lw = lastWatered(plant);
    if (!lw) return true;
    const lastDate = parseLocalDate(lw);
    const diffDays = Math.floor(
      (targetDate.getTime() - lastDate.getTime()) / MS_PER_DAY,
    );
    return diffDays >= Number(plant.freq || 3);
  }).length;
}

/**
 * Proyección de riego para los próximos `daysCount` días, contando cuántas
 * plantas tendrían sed cada día. Usado por el dashboard para mostrar la
 * barra de "agua esta semana".
 */
export function getDashboardWaterProjection(
  plants: readonly Plant[],
  daysCount = 5,
): DashboardWaterProjectionDay[] {
  const baseDate = parseLocalDate(today());
  const totalPlants = plants.length;
  return Array.from({ length: daysCount }, (_, index) => {
    const date = addDaysToDate(baseDate, index);
    const dateStr = formatLocalDate(date);
    const thirsty = countPlantsNeedingWaterOnDate(plants, dateStr);
    const dayLabel = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      dateStr,
      label: index === 0 ? 'Hoy' : dayLabel,
      watered: Math.max(totalPlants - thirsty, 0),
      thirsty,
      total: totalPlants,
    };
  });
}
