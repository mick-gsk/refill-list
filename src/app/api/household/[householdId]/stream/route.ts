/**
 * GET /api/household/[householdId]/stream
 * Server-Sent Events (SSE) — sendet bei Änderungen an Items einen Event.
 * Polling-Fallback: Client fragt alle 4 s neu an.
 *
 * Antwort: text/event-stream
 * Events:
 *   - ping (heartbeat)
 *   - list-updated { updatedAt: ISO string }
 */
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const { householdId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Nicht authentifiziert', { status: 401 });
  }

  // Mitgliedschaft prüfen
  const membership = await db.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId: session.user.id,
      },
    },
  });
  if (!membership || membership.status !== 'ACTIVE') {
    return new Response('Zugriff verweigert', { status: 403 });
  }

  const encoder = new TextEncoder();
  let lastUpdatedAt: Date | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        if (!closed) controller.enqueue(encoder.encode(data));
      };

      // Initiales Ping
      send('event: ping\ndata: {}\n\n');

      // Polling-Loop: alle 4 s prüfen ob items.updatedAt sich geändert hat
      const poll = async () => {
        if (closed) return;

        try {
          const latest = await db.item.findFirst({
            where: { householdId },
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true },
          });

          const ts = latest?.updatedAt ?? null;
          if (ts && (!lastUpdatedAt || ts > lastUpdatedAt)) {
            lastUpdatedAt = ts;
            send(`event: list-updated\ndata: ${JSON.stringify({ updatedAt: ts.toISOString() })}\n\n`);
          } else {
            send('event: ping\ndata: {}\n\n');
          }
        } catch {
          // DB-Fehler ignorieren, Verbindung offen halten
        }

        if (!closed) setTimeout(poll, 4000);
      };

      setTimeout(poll, 4000);

      // Verbindungsabbruch erkennen
      req.signal.addEventListener('abort', () => {
        closed = true;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
