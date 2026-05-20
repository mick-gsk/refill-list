/**
 * POST /api/household/join
 * Nimmt einen Einladungstoken entgegen und trägt den User als MEMBER ein.
 *
 * Body: { token: string, nickname?: string }
 * Response: { householdId, householdName }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const joinSchema = z.object({
  token: z.string().min(1),
  nickname: z.string().min(1).max(40).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 });
  }

  const invite = await db.householdInvite.findUnique({
    where: { token: parsed.data.token },
    include: { household: true },
  });

  if (!invite) {
    return NextResponse.json({ error: 'Einladungslink ungültig' }, { status: 404 });
  }
  if (invite.revokedAt) {
    return NextResponse.json({ error: 'Einladungslink wurde widerrufen' }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Einladungslink ist abgelaufen' }, { status: 410 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: 'Einladungslink wurde bereits verwendet' }, { status: 409 });
  }

  // Prüfen ob User bereits Mitglied dieses Haushalts ist
  const alreadyMember = await db.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: invite.householdId,
        userId: session.user.id,
      },
    },
  });
  if (alreadyMember?.status === 'ACTIVE') {
    return NextResponse.json({ error: 'Du bist bereits Mitglied dieses Haushalts' }, { status: 409 });
  }

  await db.$transaction([
    db.householdMember.upsert({
      where: {
        householdId_userId: {
          householdId: invite.householdId,
          userId: session.user.id,
        },
      },
      update: { status: 'ACTIVE', role: 'MEMBER' },
      create: {
        householdId: invite.householdId,
        userId: session.user.id,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    }),
    db.householdInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
    // Nickname optional als User.name speichern, wenn noch nicht gesetzt
    ...(parsed.data.nickname
      ? [
          db.user.update({
            where: { id: session.user.id },
            data: { name: parsed.data.nickname },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({
    householdId: invite.householdId,
    householdName: invite.household.name,
  });
}
