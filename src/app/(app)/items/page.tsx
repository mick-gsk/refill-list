/**
 * /items — Vollständige Artikelliste mit Filter und Add-Button (RL-02, RL-03).
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ItemList } from '@/components/item-list/ItemList';
import Link from 'next/link';
import type { ItemWithCategory } from '@/shared/types/index';

export default async function ItemsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const householdId = (session as { householdId?: string | null }).householdId;
  if (!householdId) redirect('/');

  const userId = session.user.id;

  const items = await db.item.findMany({
    where: { householdId },
    include: { category: true },
    orderBy: [{ isStandard: 'desc' }, { frequencyScore: 'desc' }, { name: 'asc' }],
  }) as unknown as ItemWithCategory[];

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: '53px', zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-bg)', borderBottom: '1px solid var(--color-divider)',
      }}>
        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
          Artikel <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({items.length})</span>
        </h1>
        <Link href="/items/new" style={btnStyle}>+ Hinzufügen</Link>
      </div>

      <ItemList items={items} householdId={householdId} userId={userId} />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
  padding: 'var(--space-2) var(--space-4)',
  background: 'var(--color-primary)', color: '#fff',
  borderRadius: 'var(--radius-md)', textDecoration: 'none',
  fontSize: 'var(--text-sm)', fontWeight: 500, minHeight: '44px',
};
