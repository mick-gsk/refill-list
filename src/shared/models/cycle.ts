/**
 * Verbrauchszyklus-Berechnung (RL-11).
 * Reine Funktionen — kein Framework, kein DB-Zugriff.
 */
import type { CycleConfidence } from '../types/index';

const FALLBACK_CYCLE_DAYS: Record<string, number> = {
  Frischwaren: 5,
  Trockenwaren: 21,
  Hygiene: 28,
  Haushalt: 45,
  Sonstiges: 14,
};

/**
 * Berechnet avg_cycle_days aus einer Liste von empty-Event-Zeitstempeln.
 * Verwendet gleitenden Durchschnitt der letzten 5 Intervalle.
 * @param emptyEventDates - Zeitstempel aller MARKED_EMPTY-Events, chronologisch
 * @returns Durchschnittliche Zyklus-Tage oder null wenn <2 Events
 */
export function computeAvgCycleDays(emptyEventDates: Date[]): number | null {
  if (emptyEventDates.length < 2) return null;
  const sorted = [...emptyEventDates].sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = (sorted[i]!.getTime() - sorted[i - 1]!.getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(days);
  }
  const last5 = intervals.slice(-5);
  return last5.reduce((a, b) => a + b, 0) / last5.length;
}

/**
 * Bestimmt die Zyklus-Konfidenz anhand der Anzahl verfügbarer Events.
 * @param eventCount - Anzahl MARKED_EMPTY-Events
 * @returns CycleConfidence-Stufe
 */
export function computeCycleConfidence(eventCount: number): CycleConfidence {
  if (eventCount >= 8) return 'HIGH';
  if (eventCount >= 4) return 'MEDIUM';
  if (eventCount >= 2) return 'LOW';
  return 'NONE';
}

/**
 * Berechnet das vorhergesagte nächste Leer-Datum.
 * @param lastEmptyDate - Letztes MARKED_EMPTY-Event
 * @param avgCycleDays - Durchschnittliche Zyklustage (oder Kategorie-Fallback)
 * @returns Vorhergesagtes Datum
 */
export function computeNextPredictedEmpty(lastEmptyDate: Date, avgCycleDays: number): Date {
  return new Date(lastEmptyDate.getTime() + avgCycleDays * 24 * 60 * 60 * 1000);
}

/**
 * Gibt den Fallback-Zyklus für eine Kategorie zurück.
 * @param categoryName - Name der Kategorie
 * @returns Fallback-Tage (14 wenn unbekannte Kategorie)
 */
export function getCategoryFallbackDays(categoryName: string | null | undefined): number {
  if (!categoryName) return 14;
  return FALLBACK_CYCLE_DAYS[categoryName] ?? 14;
}
