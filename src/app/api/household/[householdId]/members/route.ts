/**
 * GET /api/household/[householdId]/members
 * Gibt alle aktiven Mitglieder des Haushalts zurück.
 * Nur für Haushaltsmitglieder.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const { householdId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const membership = await db.householdMember.findUnique({
    where: {
      householdId_userId: { householdId, userId: session.user.id },
    },
  });
  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
  }

  const members = await db.householdMember.findMany({
    where: { householdId, status: 'ACTIVE' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    })),
  );
}
