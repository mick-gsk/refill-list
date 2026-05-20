/**
 * POST /api/household
 * Erstellt einen neuen Haushalt und trägt den aufrufenden User als OWNER ein.
 *
 * Body: { name: string }
 * Response: { householdId, inviteToken }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 });
  }

  // Prüfen ob User bereits Mitglied eines Haushalts ist (MVP: kein Multi-Haushalt)
  const existing = await db.householdMember.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE' },
  });
  if (existing) {
    return NextResponse.json({ error: 'Du bist bereits Mitglied eines Haushalts' }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage

  const household = await db.household.create({
    data: {
      name: parsed.data.name,
      members: {
        create: {
          userId: session.user.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      },
      invites: {
        create: { expiresAt },
      },
    },
    include: {
      invites: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return NextResponse.json(
    {
      householdId: household.id,
      householdName: household.name,
      inviteToken: household.invites[0].token,
    },
    { status: 201 },
  );
}
