/**
 * POST /api/household/invite
 * Generiert einen neuen Einladungslink für den Haushalt des eingeloggten Users.
 * Nur für OWNER.
 *
 * Response: { token, expiresAt }
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const membership = await db.householdMember.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE' },
  });
  if (!membership) {
    return NextResponse.json({ error: 'Kein aktiver Haushalt gefunden' }, { status: 404 });
  }

  if (membership.role !== 'OWNER') {
    return NextResponse.json({ error: 'Nur der Haushaltseigentümer kann Einladungen erstellen' }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage

  const invite = await db.householdInvite.create({
    data: {
      householdId: membership.householdId,
      expiresAt,
    },
  });

  return NextResponse.json({ token: invite.token, expiresAt: invite.expiresAt });
}
