/**
 * Berechnet die angezeigte Artikelpriorität (RL-14).
 * Reine Funktion — kein Framework, kein DB-Zugriff.
 */
import type { Item, ItemPriority } from '../types/index';

/**
 * @param item - Artikel mit Status und Zyklus-Daten
 * @param now - Aktueller Zeitpunkt (default: Date.now())
 * @returns Berechnete Prioritätsstufe
 */
export function computePriority(item: Pick<Item, 'status' | 'nextPredictedEmpty' | 'priorityOverride' | 'priorityOverrideUntil'>, now = new Date()): ItemPriority {
  // Manueller Override (max. 24h)
  if (item.priorityOverride && item.priorityOverrideUntil && item.priorityOverrideUntil > now) {
    return 'CRITICAL';
  }

  if (item.status === 'EMPTY') return 'CRITICAL';

  const predicted = item.nextPredictedEmpty;
  if (!predicted) {
    return item.status === 'LOW' ? 'SOON' : 'ROUTINE';
  }

  const daysUntil = (predicted.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntil <= 0) return 'CRITICAL';
  if (daysUntil <= 3) return 'SOON';
  if (daysUntil <= 14) return 'ROUTINE';
  return 'NO_NEED';
}
