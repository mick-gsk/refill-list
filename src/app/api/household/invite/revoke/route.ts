/**
 * POST /api/household/invite/revoke
 * Widerruft einen Einladungstoken. Nur für den Haushalt-Owner.
 *
 * Body: { token: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireOwner, requireHouseholdId, AccessDeniedError } from '@/lib/household';
import { z } from 'zod';

const revokeSchema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Token fehlt' }, { status: 400 });
  }

  try {
    const householdId = requireHouseholdId(session as { householdId?: string | null });
    await requireOwner(householdId, session.user.id);

    const invite = await db.householdInvite.findUnique({
      where: { token: parsed.data.token },
    });
    if (!invite || invite.householdId !== householdId) {
      return NextResponse.json({ error: 'Einladung nicht gefunden' }, { status: 404 });
    }
    if (invite.revokedAt) {
      return NextResponse.json({ error: 'Einladung wurde bereits widerrufen' }, { status: 409 });
    }

    await db.householdInvite.update({
      where: { id: invite.id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AccessDeniedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
