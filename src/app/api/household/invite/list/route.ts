/**
 * GET /api/household/invite/list
 * Gibt alle aktiven (nicht abgelaufenen, nicht widerrufenen) Einladungen
 * des eigenen Haushalts zurück. Nur für Owner.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireOwner, requireHouseholdId, AccessDeniedError } from '@/lib/household';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  try {
    const householdId = requireHouseholdId(session as { householdId?: string | null });
    await requireOwner(householdId, session.user.id);

    const now = new Date();
    const invites = await db.householdInvite.findMany({
      where: {
        householdId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      invites.map((inv) => ({
        id: inv.id,
        token: inv.token,
        expiresAt: inv.expiresAt,
        usedAt: inv.usedAt,
        createdAt: inv.createdAt,
      })),
    );
  } catch (err) {
    if (err instanceof AccessDeniedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
