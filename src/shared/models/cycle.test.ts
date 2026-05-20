import { describe, it, expect } from 'vitest';
import {
  computeAvgCycleDays,
  computeCycleConfidence,
  computeNextPredictedEmpty,
  getCategoryFallbackDays,
} from './cycle';
import { computeFrequencyScore } from './suggestion';

describe('computeAvgCycleDays', () => {
  it('gibt null zurück bei <2 Events', () => {
    expect(computeAvgCycleDays([])).toBeNull();
    expect(computeAvgCycleDays([new Date()])).toBeNull();
  });

  it('berechnet Durchschnitt korrekt', () => {
    const d0 = new Date('2026-01-01');
    const d1 = new Date('2026-01-08'); // 7 Tage
    const d2 = new Date('2026-01-17'); // 9 Tage
    const avg = computeAvgCycleDays([d0, d1, d2]);
    expect(avg).toBeCloseTo(8, 1);
  });

  it('nutzt nur die letzten 5 Intervalle', () => {
    const dates = Array.from({ length: 8 }, (_, i) => new Date(2026, 0, i * 7 + 1));
    const avg = computeAvgCycleDays(dates);
    expect(avg).toBeCloseTo(7, 0);
  });
});

describe('computeCycleConfidence', () => {
  it.each([
    [0, 'NONE'], [1, 'NONE'], [2, 'LOW'], [3, 'LOW'],
    [4, 'MEDIUM'], [7, 'MEDIUM'], [8, 'HIGH'], [20, 'HIGH'],
  ] as const)('eventCount %i → %s', (count, expected) => {
    expect(computeCycleConfidence(count)).toBe(expected);
  });
});

describe('computeNextPredictedEmpty', () => {
  it('addiert avgCycleDays korrekt', () => {
    const last = new Date('2026-05-01');
    const next = computeNextPredictedEmpty(last, 7);
    expect(next.toISOString().slice(0, 10)).toBe('2026-05-08');
  });
});

describe('getCategoryFallbackDays', () => {
  it.each([
    ['Frischwaren', 5], ['Hygiene', 28], ['Haushalt', 45],
    [null, 14], [undefined, 14], ['Unbekannt', 14],
  ] as const)('Kategorie %s → %i Tage', (cat, expected) => {
    expect(getCategoryFallbackDays(cat)).toBe(expected);
  });
});

describe('computeFrequencyScore', () => {
  it('Standardartikel hat Mindest-Score 60', () => {
    expect(computeFrequencyScore(0, true, 0)).toBeGreaterThanOrEqual(60);
  });

  it('Score steigt mit Häufigkeit', () => {
    const low = computeFrequencyScore(2, false, 0);
    const high = computeFrequencyScore(8, false, 0);
    expect(high).toBeGreaterThan(low);
  });

  it('Score überschreitet nie 100', () => {
    expect(computeFrequencyScore(100, true, 999)).toBe(100);
  });
});
