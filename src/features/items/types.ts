/**
 * Lokale Typen für das items-Feature.
 * Nur innerhalb von features/items/ verwenden.
 */
import type { ItemStatus, ItemPriority } from '@/shared/types/index';

/** Status-Transitions-Map: welche Folge-Stati sind erlaubt? */
export const STATUS_TRANSITIONS: Record<ItemStatus, ItemStatus> = {
  OK: 'LOW',
  LOW: 'EMPTY',
  EMPTY: 'OK',
};

/** Farb-Mapping für Status-Anzeige */
export const STATUS_COLORS: Record<ItemStatus, string> = {
  OK: 'var(--color-success)',
  LOW: 'var(--color-warning, #da7101)',
  EMPTY: 'var(--color-error)',
};

/** Label-Mapping für Status-Anzeige */
export const STATUS_LABELS: Record<ItemStatus, string> = {
  OK: 'Vorhanden',
  LOW: 'Fast leer',
  EMPTY: 'Leer',
};

/** Label-Mapping für Priorität */
export const PRIORITY_LABELS: Record<ItemPriority, string> = {
  CRITICAL: 'Kritisch',
  SOON: 'Bald nötig',
  ROUTINE: 'Routine',
  NO_NEED: 'Kein Bedarf',
};

/** Farb-Mapping für Priorität (WCAG AA) */
export const PRIORITY_COLORS: Record<ItemPriority, string> = {
  CRITICAL: 'var(--color-error)',
  SOON: 'var(--color-warning, #da7101)',
  ROUTINE: 'var(--color-text-muted)',
  NO_NEED: 'var(--color-text-faint)',
};
