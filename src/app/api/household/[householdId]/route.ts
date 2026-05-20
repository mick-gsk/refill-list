/**
 * GET /api/household/[householdId]
 * Gibt Haushalt-Details zurück. Nur für aktive Mitglieder.
 *
 * PATCH /api/household/[householdId]
 * Aktualisiert Haushalt-Name oder reminderSettings. Nur für Owner.
 *
 * Body (PATCH): { name?: string; reminderSettings?: object }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireActiveMember, requireOwner, AccessDeniedError } from '@/lib/household';
import { z } from 'zod';

type Params = { params: Promise<{ householdId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { householdId } = await params;
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

  const household = await db.household.findUnique({
    where: { id: householdId },
    include: {
      members: {
        where: { status: 'ACTIVE' },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });
  if (!household) {
    return NextResponse.json({ error: 'Haushalt nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json({
    id: household.id,
    name: household.name,
    reminderSettings: household.reminderSettings,
    createdAt: household.createdAt,
    members: household.members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    })),
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  reminderSettings: z.record(z.unknown()).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { householdId } = await params;
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

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 });
  }

  const household = await db.household.update({
    where: { id: householdId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.reminderSettings ? { reminderSettings: parsed.data.reminderSettings } : {}),
    },
  });

  return NextResponse.json({ id: household.id, name: household.name });
}
