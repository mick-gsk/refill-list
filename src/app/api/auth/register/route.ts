/**
 * POST /api/auth/register — Neuen Nutzer anlegen.
 * Gibt 409 zurück wenn E-Mail bereits vergeben.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: 'E-Mail bereits registriert.' }, { status: 409 });
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash: hash },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
