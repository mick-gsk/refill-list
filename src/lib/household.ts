/**
 * Shared helper: Mitgliedschaft prüfen.
 * Wirft einen strukturierten Fehler wenn kein Zugriff besteht.
 * Wird von allen API-Routes verwendet, die Haushaltsdaten lesen/schreiben.
 */
import { db } from '@/lib/db';

export class AccessDeniedError extends Error {
  status: number;
  constructor(message = 'Zugriff verweigert', status = 403) {
    super(message);
    this.status = status;
    this.name = 'AccessDeniedError';
  }
}

/**
 * Gibt die Mitgliedschaft zurück oder wirft AccessDeniedError.
 * Prüft: userId im Haushalt, status === ACTIVE.
 */
export async function requireActiveMember(householdId: string, userId: string) {
  const member = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!member || member.status !== 'ACTIVE') {
    throw new AccessDeniedError();
  }
  return member;
}

/**
 * Gibt die Mitgliedschaft zurück oder wirft AccessDeniedError.
 * Zusätzlich: role === OWNER erforderlich.
 */
export async function requireOwner(householdId: string, userId: string) {
  const member = await requireActiveMember(householdId, userId);
  if (member.role !== 'OWNER') {
    throw new AccessDeniedError('Nur der Haushalts-Owner darf diese Aktion ausführen');
  }
  return member;
}

/**
 * Gibt die householdId aus der Session zurück.
 * Wirft AccessDeniedError wenn kein Haushalt verknüpft ist.
 */
export function requireHouseholdId(
  session: { householdId?: string | null } | null | undefined,
): string {
  const id = session?.householdId;
  if (!id) throw new AccessDeniedError('Du bist noch kein Mitglied eines Haushalts', 403);
  return id;
}
