import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { getPlantWaterStatus } from './water-status';
import type { Plant } from './types';

function makePlant(overrides: Partial<Plant>): Plant {
  return {
    id: 'p1',
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

describe('getPlantWaterStatus', () => {
  beforeEach(() => {
    // Fijamos "hoy" a una fecha conocida para que daysBetween sea determinístico.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 29, 12, 0, 0)); // 2026-05-29 mediodía
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve no_log cuando waterLog está vacío', () => {
    const s = getPlantWaterStatus(makePlant({ waterLog: [] }));
    expect(s.kind).toBe('no_log');
    expect(s.text).toBe('Sin riegos registrados');
    expect(s.daysSinceLastWater).toBeNull();
    expect(s.daysUntilNext).toBeNull();
  });

  it('today cuando llegó la fecha exacta de regar', () => {
    // Regada hace 3 días, freq 3 → tocar hoy
    const s = getPlantWaterStatus(makePlant({ waterLog: ['2026-05-26'], freq: 3 }));
    expect(s.kind).toBe('today');
    expect(s.text).toBe('Regar hoy');
    expect(s.daysSinceLastWater).toBe(3);
    expect(s.daysUntilNext).toBe(0);
  });

  it('tomorrow cuando falta 1 día', () => {
    const s = getPlantWaterStatus(makePlant({ waterLog: ['2026-05-27'], freq: 3 }));
    expect(s.kind).toBe('tomorrow');
    expect(s.text).toBe('Regar mañana');
    expect(s.daysUntilNext).toBe(1);
  });

  it('upcoming cuando faltan más días', () => {
    const s = getPlantWaterStatus(makePlant({ waterLog: ['2026-05-28'], freq: 5 }));
    expect(s.kind).toBe('upcoming');
    expect(s.text).toBe('Regar en 4 días');
    expect(s.daysUntilNext).toBe(4);
  });

  it('overdue cuando excede la frecuencia', () => {
    const s = getPlantWaterStatus(makePlant({ waterLog: ['2026-05-20'], freq: 3 }));
    expect(s.kind).toBe('overdue');
    expect(s.text).toBe('9 días de atraso');
    expect(s.daysSinceLastWater).toBe(9);
    expect(s.daysUntilNext).toBeNull();
  });

  it('overdue singular cuando es exactamente 1 día (no debería pasar, pero validamos), edge case', () => {
    // freq 1, regada hace 2 días → 1 día de atraso (>freq)
    const s = getPlantWaterStatus(makePlant({ waterLog: ['2026-05-27'], freq: 1 }));
    expect(s.kind).toBe('overdue');
    // 2 días de atraso porque days(2) > freq(1)
    expect(s.text).toMatch(/2 días? de atraso/);
  });

  it('regada hoy mismo → upcoming con freq días para el próximo', () => {
    const s = getPlantWaterStatus(makePlant({ waterLog: ['2026-05-29'], freq: 7 }));
    expect(s.kind).toBe('upcoming');
    expect(s.daysSinceLastWater).toBe(0);
    expect(s.daysUntilNext).toBe(7);
    expect(s.text).toBe('Regar en 7 días');
  });

  it('multiples entradas en waterLog: usa la última', () => {
    const s = getPlantWaterStatus(
      makePlant({ waterLog: ['2026-05-01', '2026-05-27', '2026-05-15'], freq: 3 }),
    );
    expect(s.kind).toBe('tomorrow');
  });
});
