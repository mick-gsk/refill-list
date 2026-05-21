'use server';
/**
 * Server Actions für Artikel-Status-Änderungen (RL-02).
 * updateItemStatus: OK → LOW → EMPTY → OK mit History-Eintrag.
 * toggleItemStatus: Alias für ShoppingTileGrid-Kompatibilität.
 */
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { ItemStatus } from '@prisma/client';

export interface UpdateItemStatusInput {
  itemId: string;
  status: ItemStatus;
}

export interface UpdateItemStatusContext {
  userId: string;
}

export interface UpdateItemStatusResult {
  success: boolean;
  error?: string;
}

/**
 * Aktualisiert den Status eines Artikels und schreibt einen History-Eintrag.
 * Bei EMPTY: itemState → PLANNED (sofortiger Eintrag in Einkaufsliste).
 * Bei LOW:   frequencyScore +1 (Habit-Loop-Signal, RL-04).
 */
export async function updateItemStatus(
  input: UpdateItemStatusInput,
  ctx: UpdateItemStatusContext,
): Promise<UpdateItemStatusResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Nicht authentifiziert' };

  try {
    // Artikel laden, um householdId und aktuellen Namen zu ermitteln
    const item = await db.item.findUnique({
      where: { id: input.itemId },
      select: { id: true, name: true, householdId: true, frequencyScore: true },
    });
    if (!item) return { success: false, error: 'Artikel nicht gefunden' };

    // Mitgliedschaft prüfen
    const member = await db.householdMember.findUnique({
      where: {
        householdId_userId: { householdId: item.householdId, userId: session.user.id },
      },
    });
    if (!member || member.status !== 'ACTIVE') {
      return { success: false, error: 'Kein Zugriff' };
    }

    // Status-abhängige Felder
    const extraData: Record<string, unknown> = {};
    if (input.status === 'EMPTY') {
      extraData.itemState = 'PLANNED'; // sofort auf Einkaufsliste
    }
    if (input.status === 'LOW') {
      extraData.frequencyScore = Math.min(100, item.frequencyScore + 1);
    }
    if (input.status === 'OK') {
      extraData.itemState = 'AVAILABLE';
    }

    // History-EventType ableiten
    const eventTypeMap: Record<ItemStatus, 'MARKED_LOW' | 'MARKED_EMPTY' | 'MARKED_OK'> = {
      LOW: 'MARKED_LOW',
      EMPTY: 'MARKED_EMPTY',
      OK: 'MARKED_OK',
    };

    // Item-Update + History in einer Transaktion
    await db.$transaction([
      db.item.update({
        where: { id: input.itemId },
        data: {
          status: input.status,
          lastChangedById: session.user.id,
          updatedAt: new Date(),
          ...extraData,
        },
      }),
      db.shoppingHistory.create({
        data: {
          eventType: eventTypeMap[input.status],
          source: 'APP',
          itemName: item.name,
          itemId: input.itemId,
          householdId: item.householdId,
          triggeredById: session.user.id,
        },
      }),
    ]);

    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[updateItemStatus]', err);
    return { success: false, error: 'Datenbankfehler' };
  }
}

/**
 * Legacy-Alias für ShoppingTileGrid (toggleItemStatus bleibt abwärtskompatibel).
 */
export async function toggleItemStatus(
  itemId: string,
  householdId: string,
  newStatus: ItemStatus,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Nicht authentifiziert');

  const member = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: session.user.id } },
  });
  if (!member || member.status !== 'ACTIVE') throw new Error('Kein Zugriff');

  await db.item.update({
    where: { id: itemId, householdId },
    data: {
      status: newStatus,
      lastChangedById: session.user.id,
    },
  });

  revalidatePath('/');
}
