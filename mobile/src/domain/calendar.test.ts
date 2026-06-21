import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCalendarMonthData,
  nextMonth,
  prevMonth,
  toggleWaterLogDate,
  MONTH_NAMES,
} from './calendar';
import type { Plant } from './types';

function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: overrides.id ?? 'p1',
    name: 'Test',
    species: '',
    emoji: '🌿',
    section: null,
    freq: 3,
    waterLog: [],
    imagePreview: '',
    identifiedSpecies: '',
    identificationConfidence: null,
    identifiedAt: null,
    ...overrides,
  };
}

describe('MONTH_NAMES', () => {
  it('tiene 12 meses en orden', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe('Enero');
    expect(MONTH_NAMES[11]).toBe('Diciembre');
  });
});

describe('getCalendarMonthData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 25)); // 25 mayo 2026 (lunes)
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('marca isToday correctamente', () => {
    const plant = makePlant();
    const { cells } = getCalendarMonthData(plant, 2026, 4);
    const todayCell = cells.find(
      (c) => !c.empty && c.dateStr === '2026-05-25',
    );
    expect(todayCell && !todayCell.empty && todayCell.isToday).toBe(true);
  });

  it('marca isWatered solo para las fechas del waterLog en ese mes', () => {
    const plant = makePlant({
      waterLog: ['2026-05-10', '2026-04-30'], // una en mayo, una en abril
    });
    const { cells } = getCalendarMonthData(plant, 2026, 4); // mayo
    const day10 = cells.find((c) => !c.empty && c.day === 10);
    const day30 = cells.find((c) => !c.empty && c.day === 30);
    expect(day10 && !day10.empty && day10.isWatered).toBe(true);
    // El 30 de abril NO debería marcarse como regado en el mes de mayo
    expect(day30 && !day30.empty && day30.isWatered).toBe(false);
  });

  it('canToggle es true solo para hoy y pasado', () => {
    const plant = makePlant();
    const { cells } = getCalendarMonthData(plant, 2026, 4);
    const past = cells.find((c) => !c.empty && c.day === 10);
    const today = cells.find((c) => !c.empty && c.day === 25);
    const future = cells.find((c) => !c.empty && c.day === 28);
    expect(past && !past.empty && past.canToggle).toBe(true);
    expect(today && !today.empty && today.canToggle).toBe(true);
    expect(future && !future.empty && future.canToggle).toBe(false);
  });

  it('proyecta riegos futuros a partir de lastWatered + freq', () => {
    const plant = makePlant({
      freq: 5,
      waterLog: ['2026-05-22'], // próxima proyección: 27 mayo, 1 jun, ...
    });
    const { cells } = getCalendarMonthData(plant, 2026, 4);
    const day27 = cells.find((c) => !c.empty && c.day === 27);
    expect(day27 && !day27.empty && day27.isProjected).toBe(true);
    // El día 22 NO es proyección (es el riego real)
    const day22 = cells.find((c) => !c.empty && c.day === 22);
    expect(day22 && !day22.empty && day22.isProjected).toBe(false);
  });

  it('agrega celdas vacías al inicio según el día de la semana', () => {
    // Mayo 2026: el 1 de mayo es viernes. Lunes=0, Vie=4 → 4 celdas vacías.
    const { cells } = getCalendarMonthData(makePlant(), 2026, 4);
    const emptyAtStart = cells.filter((c, i) => c.empty && i < 4).length;
    expect(emptyAtStart).toBe(4);
  });
});

describe('prevMonth / nextMonth', () => {
  it('navegan dentro del mismo año', () => {
    expect(prevMonth(2026, 5)).toEqual({ year: 2026, month: 4 });
    expect(nextMonth(2026, 5)).toEqual({ year: 2026, month: 6 });
  });
  it('rollover de año', () => {
    expect(prevMonth(2026, 0)).toEqual({ year: 2025, month: 11 });
    expect(nextMonth(2026, 11)).toEqual({ year: 2027, month: 0 });
  });
});

describe('toggleWaterLogDate', () => {
  it('agrega una fecha que no estaba (ordenada)', () => {
    const result = toggleWaterLogDate(['2026-05-10', '2026-05-20'], '2026-05-15');
    expect(result.action).toBe('added');
    expect(result.waterLog).toEqual(['2026-05-10', '2026-05-15', '2026-05-20']);
  });
  it('quita una fecha que ya estaba', () => {
    const result = toggleWaterLogDate(['2026-05-10', '2026-05-20'], '2026-05-10');
    expect(result.action).toBe('removed');
    expect(result.waterLog).toEqual(['2026-05-20']);
  });
  it('no muta el array de entrada', () => {
    const input = ['2026-05-10'];
    toggleWaterLogDate(input, '2026-05-15');
    expect(input).toEqual(['2026-05-10']);
  });
});
