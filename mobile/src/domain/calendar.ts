/**
 * Lógica del calendario mensual de Musgo, portada desde lib/domain/calendar.js.
 *
 * Diferencias con la versión web:
 * - Se porta SOLO la lógica pura (getCalendarMonthData). El renderizado
 *   HTML (renderCalendarCells, renderInlinePlantCalendar) y los handlers
 *   de click se reescriben como componentes RN en src/screens cuando llegue
 *   la pantalla de detalle de planta — no son parte del dominio.
 * - Toggle de riego (calDayClick) es lógica de mutación + sync, vive en
 *   src/lib/actions o en el screen, no en domain.
 */

import type { Plant, DateStr } from './types';
import { formatLocalDate, lastWatered, parseLocalDate, today } from './watering';

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/** Celda del calendario. Las celdas vacías son los espacios antes del día 1. */
export type CalendarCell =
  | { empty: true }
  | {
      empty?: false;
      day: number;
      dateStr: DateStr;
      isToday: boolean;
      isWatered: boolean;
      isProjected: boolean;
      canToggle: boolean;
    };

export interface CalendarMonthData {
  cells: CalendarCell[];
}

/**
 * Construye la grilla del calendario mensual para una planta.
 *
 * - `isWatered`: true si la planta tiene esa fecha en su waterLog.
 * - `isProjected`: true si esa fecha es un riego FUTURO proyectado
 *   (basado en lastWatered + freq, repetido hasta cubrir el mes).
 * - `canToggle`: true si la fecha es hoy o pasado (no se puede marcar
 *   un riego en el futuro).
 *
 * La semana arranca el lunes (estilo europeo), como la web actual.
 */
export function getCalendarMonthData(
  plant: Plant,
  year: number,
  /** 0-indexado: enero=0, diciembre=11 */
  month: number,
): CalendarMonthData {
  const todayStr = today();
  const todayDate = parseLocalDate(todayStr);

  const wateredSet = new Set(
    (plant.waterLog || [])
      .filter((dateStr) => {
        const date = parseLocalDate(dateStr);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .map((dateStr) => parseLocalDate(dateStr).getDate()),
  );

  const firstDay = new Date(year, month, 1);
  // getDay(): 0=domingo, 1=lunes, ..., 6=sábado.
  // Convertimos para que la semana arranque en lunes (lunes=0, domingo=6).
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const lw = lastWatered(plant);
  const projectedWaterDays = new Set<number>();
  if (lw) {
    const cursor = parseLocalDate(lw);
    cursor.setHours(0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    while (cursor <= monthEnd) {
      cursor.setDate(cursor.getDate() + plant.freq);
      const isFutureOccurrence = cursor > todayDate;
      if (
        isFutureOccurrence &&
        cursor.getFullYear() === year &&
        cursor.getMonth() === month
      ) {
        projectedWaterDays.add(cursor.getDate());
      }
    }
  }

  const cells: CalendarCell[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ empty: true });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const cellStr = formatLocalDate(cellDate);
    const isToday = cellStr === todayStr;
    const isWatered = wateredSet.has(day);
    const isProjected = projectedWaterDays.has(day);
    const isPastOrToday = cellDate <= todayDate;
    cells.push({
      day,
      dateStr: cellStr,
      isToday,
      isWatered,
      isProjected,
      canToggle: isPastOrToday,
    });
  }

  return { cells };
}

/**
 * Helpers para navegar mes adelante/atrás. Retornan { year, month } nuevos
 * sin mutar nada. El estado vive en el componente.
 */
export function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}

/**
 * Toggle puro: dado un waterLog y una fecha, devuelve el nuevo waterLog
 * (ordenado) con esa fecha agregada si no estaba, o quitada si estaba.
 * No persiste nada — el caller decide qué hacer con el resultado.
 *
 * Retorna también `action` para que el caller pueda mostrar el toast
 * correspondiente ("riego añadido" vs "riego quitado").
 */
export function toggleWaterLogDate(
  waterLog: readonly DateStr[],
  dateStr: DateStr,
): { waterLog: DateStr[]; action: 'added' | 'removed' } {
  const existingIndex = waterLog.indexOf(dateStr);
  if (existingIndex >= 0) {
    const next = waterLog.slice();
    next.splice(existingIndex, 1);
    return { waterLog: next, action: 'removed' };
  }
  const next = waterLog.slice();
  next.push(dateStr);
  next.sort();
  return { waterLog: next, action: 'added' };
}
