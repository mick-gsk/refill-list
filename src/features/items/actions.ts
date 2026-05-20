'use server';
/**
 * Server Actions für Artikel-Status-Änderungen.
 * toggleItemStatus: OK ↔ EMPTY, wird vom ShoppingTileGrid aufgerufen.
 */
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { ItemStatus } from '@prisma/client';

export async function toggleItemStatus(
  itemId: string,
  householdId: string,
  newStatus: ItemStatus,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Nicht authentifiziert');

  // Mitgliedschaft prüfen
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
