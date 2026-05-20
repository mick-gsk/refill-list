/**
 * Lokale Typen für das household-Feature.
 */

/** Seeding-Liste gängiger Standardartikel (RL-03) */
export const STANDARD_ITEMS_SEED = [
  { name: 'Milch', category: 'Frischwaren' },
  { name: 'Butter', category: 'Frischwaren' },
  { name: 'Eier', category: 'Frischwaren' },
  { name: 'Brot', category: 'Frischwaren' },
  { name: 'Käse', category: 'Frischwaren' },
  { name: 'Joghurt', category: 'Frischwaren' },
  { name: 'Nudeln', category: 'Trockenwaren' },
  { name: 'Reis', category: 'Trockenwaren' },
  { name: 'Mehl', category: 'Trockenwaren' },
  { name: 'Zucker', category: 'Trockenwaren' },
  { name: 'Kaffee', category: 'Trockenwaren' },
  { name: 'Toilettenpapier', category: 'Hygiene' },
  { name: 'Zahnpasta', category: 'Hygiene' },
  { name: 'Duschgel', category: 'Hygiene' },
  { name: 'Spülmittel', category: 'Haushalt' },
  { name: 'Waschmittel', category: 'Haushalt' },
] as const;

/** Vordefinierte Kategorien mit Fallback-Intervallen (RL-11) */
export const DEFAULT_CATEGORIES = [
  { name: 'Frischwaren', color: '#437a22', fallbackCycleDays: 5 },
  { name: 'Trockenwaren', color: '#da7101', fallbackCycleDays: 21 },
  { name: 'Hygiene', color: '#01696f', fallbackCycleDays: 28 },
  { name: 'Haushalt', color: '#006494', fallbackCycleDays: 45 },
  { name: 'Sonstiges', color: '#7a7974', fallbackCycleDays: 14 },
] as const;
