/**
 * Vorschlags-Score-Berechnung (RL-04, RL-13).
 * Reine Funktionen — kein DB-Zugriff.
 */
import type { Item } from '../types/index';

const SUGGESTION_WINDOW_DAYS = 2;      // wie viele Tage vor predicted_empty
const MAX_DASHBOARD_SUGGESTIONS = 3;  // RL-13: harte Grenze
const MAX_WEEK_SUGGESTIONS = 8;
const DISMISS_PENALTY = -15;           // Score-Abzug nach 2x Dismiss
const DISMISS_BLOCK_THRESHOLD = 3;    // nach 3x Dismiss: 30-Tage-Sperre

/**
 * Berechnet ob ein Artikel aktuell vorgeschlagen werden soll.
 * @param item - Artikel mit Zyklus-Daten
 * @param now - Aktueller Zeitpunkt
 * @returns true wenn Artikel im Vorschlags-Fenster liegt
 */
export function isInSuggestionWindow(
  item: Pick<Item, 'status' | 'nextPredictedEmpty' | 'cycleConfidence'>,
  now = new Date()
): boolean {
  if (item.status === 'EMPTY') return false; // bereits auf Liste
  if (!item.nextPredictedEmpty) return false;
  const daysUntil = (item.nextPredictedEmpty.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntil <= SUGGESTION_WINDOW_DAYS;
}

/**
 * Berechnet den frequency_score basierend auf Kaufhistorie.
 * Score 0–100: höher = relevanter.
 * @param emptyEventCount - Anzahl MARKED_EMPTY-Events (letzte 90 Tage)
 * @param isStandard - Ist Standardartikel
 * @param daysSinceLastUpdate - Tage seit letztem Status-Update (Staleness)
 * @returns Score 0–100
 */
export function computeFrequencyScore(
  emptyEventCount: number,
  isStandard: boolean,
  daysSinceLastUpdate: number
): number {
  let score = 0;
  // Basis: Häufigkeit (max 50 Punkte)
  score += Math.min(emptyEventCount * 5, 50);
  // Standardartikel-Bonus
  if (isStandard) score = Math.max(score, 60);
  // Staleness: je länger nicht aktualisiert, desto höher
  score += Math.min(daysSinceLastUpdate * 0.5, 30);
  return Math.min(Math.round(score), 100);
}

/**
 * Filtert und sortiert Vorschläge für das Dashboard (max. 3, nur MEDIUM/HIGH).
 * @param items - Alle Artikel des Haushalts
 * @param now - Aktueller Zeitpunkt
 * @returns Gefilterte und sortierte Vorschlagsliste
 */
export function getDashboardSuggestions(
  items: Pick<Item, 'id' | 'status' | 'nextPredictedEmpty' | 'cycleConfidence' | 'frequencyScore' | 'isStandard'>[],
  now = new Date()
): typeof items {
  return items
    .filter(
      (i) =>
        i.status !== 'EMPTY' &&
        (i.cycleConfidence === 'MEDIUM' || i.cycleConfidence === 'HIGH') &&
        isInSuggestionWindow(i, now)
    )
    .sort((a, b) => b.frequencyScore - a.frequencyScore)
    .slice(0, MAX_DASHBOARD_SUGGESTIONS);
}

/**
 * Gibt Vorschläge für den Wochenbedarf-Tab zurück (max. 8, inkl. LOW-Konfidenz).
 * @param items - Alle Artikel des Haushalts
 * @param now - Aktueller Zeitpunkt
 * @returns Gefilterte und sortierte Vorschlagsliste
 */
export function getWeekSuggestions(
  items: Pick<Item, 'id' | 'status' | 'nextPredictedEmpty' | 'cycleConfidence' | 'frequencyScore' | 'isStandard'>[],
  now = new Date()
): typeof items {
  return items
    .filter((i) => i.status !== 'EMPTY' && isInSuggestionWindow(i, now))
    .sort((a, b) => b.frequencyScore - a.frequencyScore)
    .slice(0, MAX_WEEK_SUGGESTIONS);
}

export { MAX_DASHBOARD_SUGGESTIONS, DISMISS_PENALTY, DISMISS_BLOCK_THRESHOLD };
