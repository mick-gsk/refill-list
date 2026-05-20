/**
 * Cron-Endpunkt: löscht History-Events älter als 180 Tage (RL-10).
 * Aufruf: GET /api/cron/cleanup?secret=CRON_SECRET
 */
import { type NextRequest, NextResponse } from 'next/server';
import { pruneOldHistory } from '@/features/history/actions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await pruneOldHistory();
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result.data);
}
