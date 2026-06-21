import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addDaysToDate,
  countPlantsNeedingWaterOnDate,
  daysBetween,
  formatLocalDate,
  getDashboardWaterProjection,
  lastWatered,
  needsWater,
  parseLocalDate,
  today,
} from './watering';
import type { Plant } from './types';

/** Helper: planta mínima con overrides. */
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

describe('formatLocalDate / parseLocalDate', () => {
  it('roundtrip de fecha local', () => {
    const date = new Date(2026, 4, 25); // 25 mayo 2026
    expect(formatLocalDate(date)).toBe('2026-05-25');
  });

  it('parsea YYYY-MM-DD a fecha local', () => {
    const d = parseLocalDate('2026-05-25');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(25);
  });
});

describe('today() / daysBetween', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 25, 14, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('today devuelve fecha local de hoy', () => {
    expect(today()).toBe('2026-05-25');
  });

  it('daysBetween cuenta días enteros, no horas', () => {
    expect(daysBetween('2026-05-25')).toBe(0);
    expect(daysBetween('2026-05-22')).toBe(3);
    expect(daysBetween('2026-04-25')).toBe(30);
  });
});

describe('lastWatered', () => {
  it('null si no hay log', () => {
    expect(lastWatered(makePlant())).toBeNull();
  });
  it('devuelve la fecha más reciente', () => {
    const p = makePlant({
      waterLog: ['2026-05-10', '2026-05-20', '2026-05-15'],
    });
    expect(lastWatered(p)).toBe('2026-05-20');
  });
});

describe('needsWater', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 25));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('true si nunca se regó', () => {
    expect(needsWater(makePlant())).toBe(true);
  });
  it('true si pasaron >= freq días desde el último riego', () => {
    expect(
      needsWater(makePlant({ freq: 3, waterLog: ['2026-05-22'] })),
    ).toBe(true);
  });
  it('false si pasaron menos de freq días', () => {
    expect(
      needsWater(makePlant({ freq: 3, waterLog: ['2026-05-23'] })),
    ).toBe(false);
  });
});

describe('addDaysToDate', () => {
  it('no muta el input', () => {
    const d = new Date(2026, 4, 25);
    const next = addDaysToDate(d, 5);
    expect(d.getDate()).toBe(25);
    expect(next.getDate()).toBe(30);
  });
  it('cruza fin de mes', () => {
    const d = new Date(2026, 4, 30);
    const next = addDaysToDate(d, 3);
    expect(next.getMonth()).toBe(5); // junio
    expect(next.getDate()).toBe(2);
  });
});

describe('countPlantsNeedingWaterOnDate', () => {
  it('cuenta plantas que tendrían sed en una fecha futura', () => {
    const plants: Plant[] = [
      makePlant({ id: 'a', freq: 3, waterLog: ['2026-05-25'] }), // sed el 28
      makePlant({ id: 'b', freq: 5, waterLog: ['2026-05-20'] }), // sed el 25
      makePlant({ id: 'c', freq: 7, waterLog: [] }),             // siempre con sed
    ];
    // El 28 de mayo: a tiene sed (3d), b tiene sed (8d>=5), c siempre.
    expect(countPlantsNeedingWaterOnDate(plants, '2026-05-28')).toBe(3);
    // El 26 de mayo: a no (1d<3), b sí (6d>=5), c sí.
    expect(countPlantsNeedingWaterOnDate(plants, '2026-05-26')).toBe(2);
  });
});

describe('getDashboardWaterProjection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 25));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve N días con label "Hoy" en el primero', () => {
    const plants = [makePlant({ freq: 3, waterLog: ['2026-05-25'] })];
    const proj = getDashboardWaterProjection(plants, 5);
    expect(proj).toHaveLength(5);
    expect(proj[0]?.label).toBe('Hoy');
    expect(proj[0]?.dateStr).toBe('2026-05-25');
    expect(proj[0]?.thirsty).toBe(0);
    expect(proj[3]?.thirsty).toBe(1); // 28 de mayo, sed
  });

  it('thirsty + watered = total siempre', () => {
    const plants = [
      makePlant({ id: 'a', freq: 3, waterLog: ['2026-05-25'] }),
      makePlant({ id: 'b', freq: 3, waterLog: [] }),
    ];
    const proj = getDashboardWaterProjection(plants, 3);
    for (const day of proj) {
      expect(day.watered + day.thirsty).toBe(day.total);
      expect(day.total).toBe(2);
    }
  });
});
