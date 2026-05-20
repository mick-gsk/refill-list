'use client';
/**
 * Artikel-Liste mit Prioritätssortierung (RL-14) und Statuswechsel (RL-02).
 * Standardartikel erscheinen zuerst (RL-03).
 * "kein Bedarf"-Gruppe kollabiert standardmäßig.
 */
import { useState } from 'react';
import type { ItemWithCategory, ItemPriority } from '@/shared/types/index';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/features/items/types';
import { computePriority } from '@/shared/models/priority';
import { ItemStatusButton } from '@/components/item-status-button/ItemStatusButton';

interface ItemListProps {
  items: ItemWithCategory[];
  householdId: string;
  userId: string;
}

const PRIORITY_ORDER: ItemPriority[] = ['CRITICAL', 'SOON', 'ROUTINE', 'NO_NEED'];

export function ItemList({ items, householdId, userId }: ItemListProps) {
  const [noNeedExpanded, setNoNeedExpanded] = useState(false);

  // Priorität berechnen und gruppieren
  const itemsWithPriority = items.map((item) => ({
    ...item,
    priority: computePriority(item),
  }));

  const grouped = PRIORITY_ORDER.reduce<Record<ItemPriority, typeof itemsWithPriority>>(
    (acc, p) => {
      acc[p] = itemsWithPriority.filter((i) => i.priority === p);
      return acc;
    },
    { CRITICAL: [], SOON: [], ROUTINE: [], NO_NEED: [] }
  );

  if (items.length === 0) {
    return <ItemListEmpty />;
  }

  return (
    <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {PRIORITY_ORDER.filter((p) => p !== 'NO_NEED').map((priority) => {
        const group = grouped[priority];
        if (group.length === 0) return null;
        return (
          <PriorityGroup
            key={priority}
            priority={priority}
            items={group}
            householdId={householdId}
            userId={userId}
          />
        );
      })}

      {/* NO_NEED-Gruppe kollabierbar (RL-14) */}
      {grouped.NO_NEED.length > 0 && (
        <div>
          <button
            onClick={() => setNoNeedExpanded((v) => !v)}
            aria-expanded={noNeedExpanded}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-faint)',
              borderTop: '1px solid var(--color-divider)',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            <span aria-hidden="true">{noNeedExpanded ? '▾' : '▸'}</span>
            Kein Bedarf ({grouped.NO_NEED.length})
          </button>
          {noNeedExpanded && (
            <PriorityGroup
              priority="NO_NEED"
              items={grouped.NO_NEED}
              householdId={householdId}
              userId={userId}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────

function PriorityGroup({
  priority,
  items,
  householdId,
  userId,
}: {
  priority: ItemPriority;
  items: (ItemWithCategory & { priority: ItemPriority })[]
  householdId: string;
  userId: string;
}) {
  const color = PRIORITY_COLORS[priority];
  const label = PRIORITY_LABELS[priority];

  return (
    <section aria-label={label}>
      <div
        style={{
          padding: 'var(--space-2) var(--space-4)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color,
          borderTop: '1px solid var(--color-divider)',
        }}
      >
        {label}
      </div>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} householdId={householdId} userId={userId} />
      ))}
    </section>
  );
}

function ItemRow({
  item,
  householdId,
  userId,
}: {
  item: ItemWithCategory;
  householdId: string;
  userId: string;
}) {
  return (
    <div
      role="listitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid oklch(from var(--color-text) l c h / 0.06)',
        minHeight: '64px', // RL-15: ausreichend Touch-Fläche
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: item.isStandard ? 500 : 400,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
          {item.isStandard && (
            <span
              aria-label="Standardartikel"
              title="Standardartikel"
              style={{ marginLeft: 'var(--space-1)', color: 'var(--color-primary)', fontSize: 'var(--text-xs)' }}
            >
              ★
            </span>
          )}
        </p>
        {item.category && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {item.category.name}
          </p>
        )}
      </div>

      <ItemStatusButton
        itemId={item.id}
        householdId={householdId}
        initialStatus={item.status}
        userId={userId}
      />
    </div>
  );
}

function ItemListEmpty() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-8)',
        color: 'var(--color-text-muted)',
      }}
    >
      <svg
        aria-hidden="true"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-faint)' }}
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
      <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
        Noch keine Artikel
      </h3>
      <p style={{ maxWidth: '28ch', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
        Füge deinen ersten Artikel hinzu, damit die App euren Haushalt kennenlernt.
      </p>
    </div>
  );
}
