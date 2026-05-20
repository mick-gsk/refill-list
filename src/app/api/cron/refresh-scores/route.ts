/**
 * Cron-Endpunkt: aktualisiert frequency_scores aller Haushalte täglich (RL-04).
 * Aufruf: GET /api/cron/refresh-scores?secret=CRON_SECRET
 */
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { refreshAllScores } from '@/features/suggestions/actions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const households = await db.household.findMany({ select: { id: true } });
  const results = await Promise.allSettled(
    households.map((h) => refreshAllScores(h.id))
  );
  const total = results.reduce(
    (acc, r) => acc + (r.status === 'fulfilled' && r.value.success ? r.value.data.updated : 0),
    0
  );
  return NextResponse.json({ updated: total });
}
