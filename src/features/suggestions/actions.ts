'use server';
/**
 * Server Actions für Vorschlags-Logik (RL-04, RL-13).
 */
import { db } from '@/lib/db';
import { ok, err } from '@/shared/models/result';
import type { Result } from '@/shared/models/result';
import type { Item } from '@/shared/types/index';
import { getDashboardSuggestions, getWeekSuggestions } from '@/shared/models/suggestion';
import { refreshItemCycle } from '@/features/history/actions';
import { revalidatePath } from 'next/cache';

async function assertMember(householdId: string, userId: string): Promise<boolean> {
  const m = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  return !!m && m.status === 'ACTIVE';
}

/**
 * Gibt Dashboard-Vorschläge zurück (max. 3, nur MEDIUM/HIGH-Konfidenz).
 * @param householdId - Haushalt-ID
 * @param ctx - Auth-Kontext
 */
export async function fetchDashboardSuggestions(
  householdId: string,
  ctx: { userId: string }
): Promise<Result<Item[]>> {
  const isMember = await assertMember(householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  const items = await db.item.findMany({
    where: { householdId, status: { not: 'EMPTY' } },
    select: {
      id: true, status: true, nextPredictedEmpty: true,
      cycleConfidence: true, frequencyScore: true, isStandard: true,
      name: true, normalizedName: true, itemState: true,
      avgCycleDays: true, priorityOverride: true, priorityOverrideUntil: true,
      canonicalItemId: true, note: true, quantity: true, unit: true,
      householdId: true, categoryId: true, createdById: true, lastChangedById: true,
      createdAt: true, updatedAt: true,
    },
  });

  const suggestions = getDashboardSuggestions(items);
  const ids = new Set(suggestions.map((s) => s.id));
  const result = items.filter((i) => ids.has(i.id));

  return ok(result as unknown as Item[]);
}

/**
 * Gibt Wochenbedarf-Vorschläge zurück (max. 8).
 * @param householdId - Haushalt-ID
 * @param ctx - Auth-Kontext
 */
export async function fetchWeekSuggestions(
  householdId: string,
  ctx: { userId: string }
): Promise<Result<Item[]>> {
  const isMember = await assertMember(householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  const items = await db.item.findMany({
    where: { householdId, status: { not: 'EMPTY' } },
  });

  const suggestions = getWeekSuggestions(items);
  const ids = new Set(suggestions.map((s) => s.id));
  const result = items.filter((i) => ids.has(i.id));

  return ok(result as unknown as Item[]);
}

/**
 * Nimmt einen Vorschlag an: setzt Status auf LOW, schreibt History-Event.
 * @param itemId - Artikel-ID
 * @param householdId - Haushalt-ID
 * @param ctx - Auth-Kontext
 */
export async function acceptSuggestion(
  itemId: string,
  householdId: string,
  ctx: { userId: string }
): Promise<Result<Item>> {
  const isMember = await assertMember(householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  const item = await db.item.findUnique({ where: { id: itemId } });
  if (!item || item.householdId !== householdId) return err('Artikel nicht gefunden');

  const updated = await db.item.update({
    where: { id: itemId },
    data: {
      status: 'LOW',
      lastChangedById: ctx.userId,
      history: {
        create: {
          eventType: 'SUGGESTION_ACCEPTED',
          source: 'APP',
          itemName: item.name,
          householdId,
          triggeredById: ctx.userId,
        },
      },
    },
  });

  revalidatePath('/');
  revalidatePath('/week');
  return ok(updated as unknown as Item);
}

/**
 * Verwirft einen Vorschlag für 7 Tage (RL-04/RL-13 Dismiss-Logik).
 * Schreibt History-Event; nach 2x Dismiss: Score-Penalty, nach 3x: 30-Tage-Sperre.
 * @param itemId - Artikel-ID
 * @param householdId - Haushalt-ID
 * @param ctx - Auth-Kontext
 */
export async function dismissSuggestion(
  itemId: string,
  householdId: string,
  ctx: { userId: string }
): Promise<Result<{ snoozedUntil: Date; penaltyApplied: boolean }>> {
  const isMember = await assertMember(householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  const item = await db.item.findUnique({ where: { id: itemId } });
  if (!item || item.householdId !== householdId) return err('Artikel nicht gefunden');

  // Bisherige Dismissals in den letzten 60 Tagen zählen (RL-13)
  const recentDismissals = await db.shoppingHistory.count({
    where: {
      itemId,
      eventType: 'SUGGESTION_DISMISSED',
      createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    },
  });

  const dismissCount = recentDismissals + 1; // inkl. dieser Aktion
  let snoozeUntil: Date;
  let penaltyApplied = false;
  let newScore = item.frequencyScore;

  if (dismissCount >= 3) {
    // 30-Tage-Sperre
    snoozeUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    newScore = Math.max(0, item.frequencyScore - 30);
    penaltyApplied = true;
  } else if (dismissCount >= 2) {
    // Score-Penalty
    snoozeUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    newScore = Math.max(0, item.frequencyScore - 15);
    penaltyApplied = true;
  } else {
    // Standard: 7 Tage
    snoozeUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  await db.item.update({
    where: { id: itemId },
    data: {
      frequencyScore: newScore,
      nextPredictedEmpty: snoozeUntil, // missbrauche Feld als Snooze-Marker
      history: {
        create: {
          eventType: 'SUGGESTION_DISMISSED',
          source: 'APP',
          itemName: item.name,
          householdId,
          triggeredById: ctx.userId,
        },
      },
    },
  });

  revalidatePath('/');
  revalidatePath('/week');
  return ok({ snoozedUntil: snoozeUntil, penaltyApplied });
}

/**
 * Aktualisiert frequency_scores aller Artikel eines Haushalts.
 * Für täglichen Hintergrundjob via /api/cron/refresh-scores.
 * @param householdId - Haushalt-ID
 */
export async function refreshAllScores(householdId: string): Promise<Result<{ updated: number }>> {
  const items = await db.item.findMany({ where: { householdId } });
  await Promise.all(items.map((i) => refreshItemCycle(i.id, householdId)));
  return ok({ updated: items.length });
}
