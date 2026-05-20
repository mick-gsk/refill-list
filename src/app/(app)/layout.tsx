/**
 * App-Shell — Mobile-first, Bring!-inspiriert.
 * Bottom-Nav mit 3 Tabs (Liste / Katalog / Profil).
 * Sticky Header mit Haushalt-Name + Theme-Toggle.
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { BottomNav } from '@/components/shell/BottomNav';
import { AppHeader } from '@/components/shell/AppHeader';
import type { ReactNode } from 'react';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  const householdId = (session as { householdId?: string | null }).householdId;
  let householdName: string | null = null;
  if (householdId) {
    const hh = await db.household.findUnique({ where: { id: householdId }, select: { name: true } });
    householdName = hh?.name ?? null;
  }

  return (
    <div className="app-shell">
      <AppHeader householdName={householdName} userName={session.user?.name ?? null} />
      <main className="app-main">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
