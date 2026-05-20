/**
 * Dashboard / Übersicht (RL-13, RL-14).
 * Server Component: lädt Session + Haushalt-Daten,
 * rendert Prioritätsliste + max. 3 Vorschläge.
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ItemList } from '@/components/item-list/ItemList';
import { getDashboardSuggestions } from '@/shared/models/suggestion';
import Link from 'next/link';
import type { ItemWithCategory } from '@/shared/types/index';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const householdId = (session as { householdId?: string | null }).householdId;

  // Kein Haushalt → Onboarding
  if (!householdId) {
    return (
      <div style={emptyWrapStyle}>
        <h2 style={{ fontSize: 'var(--text-xl)' }}>Willkommen bei refill</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', maxWidth: '30ch', textAlign: 'center' }}>
          Erstelle einen Haushalt oder tritt einem per Einladungslink bei.
        </p>
        <Link href="/household/new" style={btnStyle}>Haushalt erstellen</Link>
      </div>
    );
  }

  const items = await db.item.findMany({
    where: { householdId },
    include: { category: true },
    orderBy: [{ isStandard: 'desc' }, { frequencyScore: 'desc' }, { updatedAt: 'asc' }],
  }) as unknown as ItemWithCategory[];

  const suggestions = getDashboardSuggestions(items);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Vorschläge (RL-13) */}
      {suggestions.length > 0 && (
        <section style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-divider)' }}>
          <h2 style={sectionHeading}>Jetzt auffüllen?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} item={s as unknown as ItemWithCategory} householdId={householdId} userId={userId} />
            ))}
          </div>
        </section>
      )}

      {/* Artikelliste */}
      <section style={{ paddingTop: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)' }}>
          <h2 style={sectionHeading}>Alle Artikel</h2>
          <Link href="/items/new" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 500 }}>
            + Neu
          </Link>
        </div>
        <ItemList items={items} householdId={householdId} userId={userId} />
      </section>
    </div>
  );
}

function SuggestionCard({
  item, householdId, userId,
}: { item: ItemWithCategory; householdId: string; userId: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-3)', background: 'var(--color-surface)',
      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
      gap: 'var(--space-3)',
    }}>
      <div>
        <p style={{ fontWeight: 500 }}>{item.name}</p>
        {item.avgCycleDays && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Ø {item.avgCycleDays}d Zyklus
          </p>
        )}
      </div>
      <span style={{
        fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)',
        background: 'var(--color-primary-highlight)', color: 'var(--color-primary)',
        borderRadius: 'var(--radius-full)', fontWeight: 500,
      }}>fällig</span>
    </div>
  );
}

const sectionHeading: React.CSSProperties = { fontSize: 'var(--text-base)', fontWeight: 600 };
const emptyWrapStyle: React.CSSProperties = { minHeight: '70dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', padding: 'var(--space-8)' };
const btnStyle: React.CSSProperties = { display: 'inline-block', padding: 'var(--space-3) var(--space-6)', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontWeight: 500, minHeight: '44px' };
