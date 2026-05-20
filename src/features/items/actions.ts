'use server';
/**
 * Server Actions für Artikel-Management (RL-02, RL-03, RL-07).
 * Auth-Check: jede Aktion prüft Haushalt-Mitgliedschaft.
 */
import { db } from '@/lib/db';
import { ok, err } from '@/shared/models/result';
import type { Result } from '@/shared/models/result';
import type { Item } from '@/shared/types/index';
import {
  createItemSchema,
  updateItemStatusSchema,
  updateItemSchema,
  deleteItemSchema,
} from '@/shared/schemas/index';
import type {
  CreateItemInput,
  UpdateItemStatusInput,
  UpdateItemInput,
  DeleteItemInput,
} from '@/shared/schemas/index';
import { normalizeItemName, similarityScore } from '@/shared/models/normalization';

const DUPLICATE_THRESHOLD = 0.85;
const STANDARD_ITEM_MIN_SCORE = 60;

// ——————————————————————————————————————————————
type AuthContext = { userId: string };

async function assertMember(householdId: string, userId: string): Promise<boolean> {
  const m = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  return !!m && m.status === 'ACTIVE';
}
// ——————————————————————————————————————————————

/**
 * Erstellt einen neuen Artikel im Haushalt.
 * Schreibt ein History-Event. Prüft auf Duplikate (RL-07, RL-20).
 * @param input - Validierte Artikel-Daten
 * @param ctx - Auth-Kontext (userId)
 * @returns Result mit erstelltem Artikel oder Duplikat-Warnung
 */
export async function createItem(
  input: CreateItemInput,
  ctx: AuthContext
): Promise<Result<{ item: Item; possibleDuplicate: string | null }>> {
  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Ungültige Eingabe');

  const isMember = await assertMember(parsed.data.householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff auf diesen Haushalt');

  const normalized = normalizeItemName(parsed.data.name);

  // Duplikat-Check (RL-20)
  const existingItems = await db.item.findMany({
    where: { householdId: parsed.data.householdId },
    select: { id: true, name: true, normalizedName: true },
  });

  const duplicate = existingItems.find(
    (i) => similarityScore(i.normalizedName, normalized) >= DUPLICATE_THRESHOLD
  );

  const frequencyScore = parsed.data.isStandard ? STANDARD_ITEM_MIN_SCORE : 0;

  const item = await db.item.create({
    data: {
      name: parsed.data.name,
      normalizedName: normalized,
      status: parsed.data.status,
      isStandard: parsed.data.isStandard,
      frequencyScore,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      note: parsed.data.note,
      householdId: parsed.data.householdId,
      categoryId: parsed.data.categoryId,
      createdById: ctx.userId,
      lastChangedById: ctx.userId,
      history: {
        create: {
          eventType: 'MARKED_LOW',
          source: parsed.data.source,
          itemName: parsed.data.name,
          householdId: parsed.data.householdId,
          triggeredById: ctx.userId,
        },
      },
    },
  });

  return ok({ item: item as unknown as Item, possibleDuplicate: duplicate?.name ?? null });
}

/**
 * Ändert den Status eines Artikels (RL-02).
 * Schreibt ein History-Event für Status-Änderungen.
 * @param input - itemId + neuer Status
 * @param ctx - Auth-Kontext
 */
export async function updateItemStatus(
  input: UpdateItemStatusInput,
  ctx: AuthContext
): Promise<Result<Item>> {
  const parsed = updateItemStatusSchema.safeParse(input);
  if (!parsed.success) return err('Ungültige Eingabe');

  const existing = await db.item.findUnique({ where: { id: parsed.data.itemId } });
  if (!existing) return err('Artikel nicht gefunden');

  const isMember = await assertMember(existing.householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  const eventTypeMap: Record<string, 'MARKED_LOW' | 'MARKED_EMPTY' | 'MARKED_OK'> = {
    LOW: 'MARKED_LOW',
    EMPTY: 'MARKED_EMPTY',
    OK: 'MARKED_OK',
  };
  const eventType = eventTypeMap[parsed.data.status] ?? 'MARKED_OK';

  const updated = await db.item.update({
    where: { id: parsed.data.itemId },
    data: {
      status: parsed.data.status,
      lastChangedById: ctx.userId,
      history: {
        create: {
          eventType,
          source: 'APP',
          itemName: existing.name,
          householdId: existing.householdId,
          triggeredById: ctx.userId,
        },
      },
    },
  });

  return ok(updated as unknown as Item);
}

/**
 * Aktualisiert Artikel-Metadaten (Name, Kategorie, isStandard, etc.).
 * @param input - Partial-Update-Daten
 * @param ctx - Auth-Kontext
 */
export async function updateItem(
  input: UpdateItemInput,
  ctx: AuthContext
): Promise<Result<Item>> {
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return err('Ungültige Eingabe');

  const existing = await db.item.findUnique({ where: { id: parsed.data.itemId } });
  if (!existing) return err('Artikel nicht gefunden');

  const isMember = await assertMember(existing.householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  const normalized = parsed.data.name ? normalizeItemName(parsed.data.name) : undefined;

  // Wenn isStandard auf true gesetzt, Mindest-Score sicherstellen (RL-03)
  const frequencyScore =
    parsed.data.isStandard === true && existing.frequencyScore < STANDARD_ITEM_MIN_SCORE
      ? STANDARD_ITEM_MIN_SCORE
      : undefined;

  const updated = await db.item.update({
    where: { id: parsed.data.itemId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(normalized && { normalizedName: normalized }),
      ...(parsed.data.categoryId !== undefined && { categoryId: parsed.data.categoryId }),
      ...(parsed.data.isStandard !== undefined && { isStandard: parsed.data.isStandard }),
      ...(parsed.data.quantity !== undefined && { quantity: parsed.data.quantity }),
      ...(parsed.data.unit !== undefined && { unit: parsed.data.unit }),
      ...(parsed.data.note !== undefined && { note: parsed.data.note }),
      ...(frequencyScore !== undefined && { frequencyScore }),
      lastChangedById: ctx.userId,
    },
  });

  return ok(updated as unknown as Item);
}

/**
 * Löscht einen Artikel aus dem Haushalt.
 * @param input - itemId
 * @param ctx - Auth-Kontext
 */
export async function deleteItem(
  input: DeleteItemInput,
  ctx: AuthContext
): Promise<Result<{ deleted: true }>> {
  const parsed = deleteItemSchema.safeParse(input);
  if (!parsed.success) return err('Ungültige Eingabe');

  const existing = await db.item.findUnique({ where: { id: parsed.data.itemId } });
  if (!existing) return err('Artikel nicht gefunden');

  const isMember = await assertMember(existing.householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  await db.item.delete({ where: { id: parsed.data.itemId } });
  return ok({ deleted: true });
}

/**
 * Gibt alle Artikel eines Haushalts sortiert nach Priorität zurück.
 * @param householdId - Haushalt-ID
 * @param ctx - Auth-Kontext
 */
export async function getItems(
  householdId: string,
  ctx: AuthContext
): Promise<Result<Item[]>> {
  const isMember = await assertMember(householdId, ctx.userId);
  if (!isMember) return err('Kein Zugriff');

  const items = await db.item.findMany({
    where: { householdId },
    orderBy: [
      { isStandard: 'desc' },
      { frequencyScore: 'desc' },
      { updatedAt: 'desc' },
    ],
    include: { category: true },
  });

  return ok(items as unknown as Item[]);
}
