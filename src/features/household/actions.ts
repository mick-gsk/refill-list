'use server';
/**
 * Server Actions für Haushalt-Management (RL-01, RL-19).
 * Alle Aktionen prüfen Session/Auth vor DB-Zugriff.
 */
import { db } from '@/lib/db';
import { ok, err } from '@/shared/models/result';
import type { Result } from '@/shared/models/result';
import type { Household, HouseholdMember, HouseholdInvite } from '@/shared/types/index';
import { createHouseholdSchema, joinHouseholdSchema } from '@/shared/schemas/index';
import type { CreateHouseholdInput, JoinHouseholdInput } from '@/shared/schemas/index';

const INVITE_TTL_HOURS = 72;

/**
 * Erstellt einen neuen Haushalt und setzt den Ersteller als OWNER.
 * @param input - Name des Haushalts + Name des Owners
 * @param userId - ID des eingeloggten Nutzers
 * @returns Result mit dem erstellten Haushalt
 */
export async function createHousehold(
  input: CreateHouseholdInput,
  userId: string
): Promise<Result<Household>> {
  const parsed = createHouseholdSchema.safeParse(input);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? 'Ungültige Eingabe');

  try {
    const household = await db.household.create({
      data: {
        name: parsed.data.name,
        members: {
          create: {
            userId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
    });
    return ok(household as unknown as Household);
  } catch {
    return err('Haushalt konnte nicht erstellt werden');
  }
}

/**
 * Generiert einen neuen Einladungslink-Token (RL-19: läuft nach TTL ab).
 * @param householdId - ID des Haushalts
 * @param requestingUserId - Muss OWNER sein
 * @returns Result mit dem Invite-Token
 */
export async function createInvite(
  householdId: string,
  requestingUserId: string
): Promise<Result<HouseholdInvite>> {
  const member = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: requestingUserId } },
  });

  if (!member || member.role !== 'OWNER') return err('Nur der Haushalts-Owner kann Einladungen erstellen');

  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  const invite = await db.householdInvite.create({
    data: { householdId, expiresAt },
  });

  return ok(invite as unknown as HouseholdInvite);
}

/**
 * Nimmt einen Einladungslink-Token an und fügt den Nutzer dem Haushalt hinzu.
 * @param input - Token + Name des neuen Mitglieds
 * @param userId - ID des beitretenden Nutzers
 * @returns Result mit der HouseholdMember-Eintragsstruktur
 */
export async function joinHousehold(
  input: JoinHouseholdInput,
  userId: string
): Promise<Result<HouseholdMember>> {
  const parsed = joinHouseholdSchema.safeParse(input);
  if (!parsed.success) return err('Ungültige Eingabe');

  const invite = await db.householdInvite.findUnique({
    where: { token: parsed.data.token },
  });

  if (!invite) return err('Einladungslink nicht gefunden');
  if (invite.revokedAt) return err('Dieser Einladungslink wurde widerrufen');
  if (invite.usedAt) return err('Dieser Einladungslink wurde bereits verwendet');
  if (invite.expiresAt < new Date()) return err('Dieser Einladungslink ist abgelaufen');

  const existing = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId: invite.householdId, userId } },
  });
  if (existing) return err('Du bist bereits Mitglied dieses Haushalts');

  const [member] = await db.$transaction([
    db.householdMember.create({
      data: { householdId: invite.householdId, userId, role: 'MEMBER', status: 'ACTIVE' },
    }),
    db.householdInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return ok(member as unknown as HouseholdMember);
}
