/**
 * /week — Wochenbedarf: max. 8 Vorschläge (RL-04, RL-13).
 * Server Component.
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getWeekSuggestions } from '@/shared/models/suggestion';
import type { ItemWithCategory } from '@/shared/types/index';

export default async function WeekPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const householdId = (session as { householdId?: string | null }).householdId;
  if (!householdId) redirect('/');

  const items = await db.item.findMany({
    where: { householdId },
    include: { category: true },
  }) as unknown as ItemWithCategory[];

  const suggestions = getWeekSuggestions(items);
  const suggestionIds = new Set(suggestions.map((s) => s.id));
  const suggestionItems = items.filter((i) => suggestionIds.has(i.id));

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
        Wochenbedarf
      </h1>

      {suggestionItems.length === 0 ? (
        <EmptyWeek />
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {suggestionItems.map((item) => (
            <WeekItem key={item.id} item={item} />
          ))}
        </ul>
      )}

      <p style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', textAlign: 'center' }}>
        Basiert auf eurem Verbrauchsrhythmus der letzten 90 Tage.
      </p>
    </div>
  );
}

function WeekItem({ item }: { item: ItemWithCategory }) {
  return (
    <li style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', gap: 'var(--space-3)',
    }}>
      <div>
        <p style={{ fontWeight: 500 }}>{item.name}</p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {item.category?.name ?? 'Sonstiges'}
          {item.avgCycleDays ? ` · Ø ${item.avgCycleDays}d` : ''}
        </p>
      </div>
      <ConfidenceBadge confidence={item.cycleConfidence ?? 'NONE'} />
    </li>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const color = confidence === 'HIGH' ? 'var(--color-success)'
    : confidence === 'MEDIUM' ? 'var(--color-primary)'
    : 'var(--color-text-faint)';
  const label = confidence === 'HIGH' ? 'Sicher'
    : confidence === 'MEDIUM' ? 'Wahrscheinlich'
    : 'Schätzung';
  return (
    <span style={{
      fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)',
      border: `1px solid ${color}`, color, borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function EmptyWeek() {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-8)', color: 'var(--color-text-muted)' }}>
      <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto var(--space-4)' }}>
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
      <p style={{ fontWeight: 500, color: 'var(--color-text)' }}>Diese Woche kein Bedarf erkannt</p>
      <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', maxWidth: '28ch', margin: 'var(--space-2) auto 0' }}>
        Aktualisiere den Status deiner Artikel, damit refill deinen Rhythmus erlernt.
      </p>
    </div>
  );
}
