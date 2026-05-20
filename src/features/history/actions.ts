'use server';
/**
 * Server Actions für Kaufhistorie (RL-10).
 * Abfrage, Zyklusberechnung-Trigger nach MARKED_EMPTY.
 */
import { db } from '@/lib/db';
import { ok, err } from '@/shared/models/result';
import type { Result } from '@/shared/models/result';
import type { ShoppingHistory } from '@/shared/types/index';
import {
  computeAvgCycleDays,
  computeCycleConfidence,
  computeNextPredictedEmpty,
  getCategoryFallbackDays,
} from '@/shared/models/cycle';
import { computeFrequencyScore } from '@/shared/models/suggestion';

const HISTORY_DISPLAY_LIMIT = 20;
const HISTORY_RETENTION_DAYS = 180;
const SCORE_LOOKBACK_DAYS = 90;

async function assertMember(householdId: string, userId: string): Promise<boolean> {
  const m = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  return !!m && m.status === 'ACTIVE';
}

/**
 * Gibt die letzten HISTORY_DISPLAY_LIMIT Events eines Haushalts zurück.
 * @param householdId - Haushalt-ID
 * @param ctx - Auth-Kontext
 */
export async function getHouseholdHistory(
  householdId: string,
  ctx: { userId: string }
): Promise<Result<ShoppingHistory[]>> {
  const isMember = await assertMember(householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  const events = await db.shoppingHistory.findMany({
    where: { householdId },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_DISPLAY_LIMIT,
    include: { triggeredBy: { select: { id: true, name: true } } },
  });

  return ok(events as unknown as ShoppingHistory[]);
}

/**
 * Aktualisiert Zyklus-Modell und frequency_score eines Artikels nach MARKED_EMPTY.
 * Wird intern nach jedem MARKED_EMPTY-Event aufgerufen.
 * @param itemId - Artikel-ID
 * @param householdId - Haushalt-ID (für Auth-Skip, interner Call)
 */
export async function refreshItemCycle(itemId: string, householdId: string): Promise<void> {
  const cutoff = new Date(Date.now() - SCORE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const [item, emptyEvents] = await Promise.all([
    db.item.findUnique({
      where: { id: itemId },
      include: { category: true },
    }),
    db.shoppingHistory.findMany({
      where: { itemId, eventType: 'MARKED_EMPTY' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ]);

  if (!item) return;

  const emptyDates = emptyEvents.map((e) => e.createdAt);
  const recentEmptyCount = emptyEvents.filter((e) => e.createdAt >= cutoff).length;

  // Zyklusberechnung (RL-11)
  const avgCycleDays = computeAvgCycleDays(emptyDates);
  const confidence = computeCycleConfidence(emptyDates.length);
  const fallback = getCategoryFallbackDays((item.category as { name: string } | null)?.name);
  const effectiveCycle = avgCycleDays ?? fallback;
  const lastEmpty = emptyDates.at(-1);
  const nextPredicted = lastEmpty
    ? computeNextPredictedEmpty(lastEmpty, effectiveCycle)
    : null;

  // Frequency-Score (RL-04)
  const daysSinceUpdate =
    (Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const newScore = computeFrequencyScore(recentEmptyCount, item.isStandard, daysSinceUpdate);

  await db.item.update({
    where: { id: itemId },
    data: {
      avgCycleDays: avgCycleDays ? Math.round(avgCycleDays) : undefined,
      cycleConfidence: confidence,
      nextPredictedEmpty: nextPredicted,
      frequencyScore: newScore,
    },
  });
}

/**
 * Löscht History-Events älter als HISTORY_RETENTION_DAYS (RL-10 Retention-Policy).
 * Als Cron-Job aufrufbar via /api/cron/cleanup.
 */
export async function pruneOldHistory(): Promise<Result<{ deleted: number }>> {
  const cutoff = new Date(Date.now() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await db.shoppingHistory.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return ok({ deleted: count });
}
