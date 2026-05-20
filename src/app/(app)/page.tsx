/**
 * Haupt-Shopping-Liste (RL-01, RL-13, RL-14).
 * Bring!-Stil: Kachelraster, nach Kategorie gruppierbar.
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ShoppingTileGrid } from '@/components/list/ShoppingTileGrid';
import Link from 'next/link';
import type { ItemWithCategory } from '@/shared/types/index';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const householdId = (session as { householdId?: string | null }).householdId;

  if (!householdId) {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-icon" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="var(--color-primary-highlight)" />
            <path d="M20 28h6a6 6 0 0 1 0 12h-6V28z" fill="var(--color-primary)" />
            <path d="M30 40l6 8" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="38" cy="22" r="4" fill="var(--color-primary)" opacity="0.5"/>
          </svg>
        </div>
        <h1 className="onboarding-title">Willkommen bei refill</h1>
        <p className="onboarding-subtitle">
          Erstelle einen Haushalt oder tritt einem per Einladungslink bei — und plant gemeinsam euren Einkauf.
        </p>
        <div className="onboarding-actions">
          <Link href="/household/new" className="btn btn-primary">Haushalt erstellen</Link>
          <Link href="/household/join" className="btn btn-secondary">Mit Link beitreten</Link>
        </div>
      </div>
    );
  }

  const items = await db.item.findMany({
    where: { householdId, itemState: { not: 'ARCHIVED' } },
    include: { category: true, createdBy: { select: { name: true } }, lastChangedBy: { select: { name: true } } },
    orderBy: [{ status: 'asc' }, { frequencyScore: 'desc' }, { name: 'asc' }],
  }) as unknown as ItemWithCategory[];

  return <ShoppingTileGrid items={items} householdId={householdId} />;
}
