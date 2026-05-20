/**
 * DELETE /api/household/[householdId]/members/[userId]
 * Entfernt ein Mitglied aus dem Haushalt (status = REMOVED).
 * Nur für den Haushalt-Owner. Owner kann sich nicht selbst entfernen.
 *
 * GET /api/household/[householdId]/members/[userId]
 * Gibt Details eines einzelnen Mitglieds zurück (nur für Mitglieder).
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireOwner, requireActiveMember, AccessDeniedError } from '@/lib/household';

type Params = { params: Promise<{ householdId: string; userId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { householdId, userId: targetUserId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  try {
    await requireOwner(householdId, session.user.id);
  } catch (err) {
    if (err instanceof AccessDeniedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  // Owner kann sich nicht selbst entfernen
  if (targetUserId === session.user.id) {
    return NextResponse.json(
      { error: 'Du kannst dich nicht selbst aus dem Haushalt entfernen' },
      { status: 400 },
    );
  }

  const target = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: targetUserId } },
  });
  if (!target || target.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 });
  }

  await db.householdMember.update({
    where: { id: target.id },
    data: { status: 'REMOVED' },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { householdId, userId: targetUserId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  try {
    await requireActiveMember(householdId, session.user.id);
  } catch (err) {
    if (err instanceof AccessDeniedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const member = await db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: targetUserId } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!member || member.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json({
    id: member.id,
    role: member.role,
    joinedAt: member.joinedAt,
    user: member.user,
  });
}
