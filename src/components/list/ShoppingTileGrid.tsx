'use client';
/**
 * Bringt!-style Kachelraster (RL-02, RL-13, RL-14).
 * Tap: Artikel abhaken → EMPTY + Toast-Feedback (Habit Loop R3).
 * Long-press (500ms): Artikel-Detail.
 */
import { useState, useRef, useTransition } from 'react';
import { toggleItemStatus } from '@/features/items/actions';
import { ToastContainer } from '@/components/shell/Toast';
import { useToast } from '@/components/shell/useToast';
import type { ItemWithCategory } from '@/shared/types/index';

type Props = {
  items: ItemWithCategory[];
  householdId: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Obst: '#f59e42',
  Gemüse: '#6abf5e',
  Milchprodukte: '#60b8f5',
  Fleisch: '#f97a7a',
  Backwaren: '#c5a97e',
  Getränke: '#8b8fe8',
  Tiefkühl: '#5fcfdb',
  Haushalt: '#b0b8c1',
  Hygiene: '#e87abf',
  Gewürze: '#fcd34d',
  default: '#a8c5b5',
};

function getTileColor(categoryName?: string | null) {
  if (!categoryName) return CATEGORY_COLORS.default;
  return CATEGORY_COLORS[categoryName] ?? CATEGORY_COLORS.default;
}

export function ShoppingTileGrid({ items, householdId }: Props) {
  const [optimisticDone, setOptimisticDone] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toasts, showToast, dismissToast } = useToast();

  const activeItems = items.filter(
    (i) => i.status !== 'EMPTY' && !optimisticDone.has(i.id),
  );
  const doneItems = items.filter(
    (i) => i.status === 'EMPTY' || optimisticDone.has(i.id),
  );

  function handleTap(item: ItemWithCategory) {
    setOptimisticDone((prev) => new Set(prev).add(item.id));
    // Toast sofort zeigen (Habit Loop)
    showToast(`"${item.name}" auf die Einkaufsliste gesetzt`, 'empty');
    startTransition(async () => {
      try {
        await toggleItemStatus(item.id, householdId, 'EMPTY');
      } catch {
        setOptimisticDone((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    });
  }

  function handleUncheck(item: ItemWithCategory) {
    setOptimisticDone((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    startTransition(async () => {
      await toggleItemStatus(item.id, householdId, 'OK');
    });
  }

  function onPointerDown(id: string) {
    longPressTimer.current = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('item-longpress', { detail: { id } }));
    }, 500);
  }
  function onPointerUp() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  return (
    <>
      <div className="tile-screen">
        {/* Suchleiste */}
        <div className="tile-search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="search"
            placeholder="Artikel suchen oder hinzufügen…"
            className="tile-search-input"
            aria-label="Artikel suchen"
          />
        </div>

        {activeItems.length === 0 && doneItems.length === 0 ? (
          <div className="tile-empty">
            <p style={{ fontSize: 'var(--text-lg)', textAlign: 'center' }}>🛒</p>
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '28ch' }}>
              Deine Liste ist leer. Tippe auf + um etwas hinzuzufügen.
            </p>
          </div>
        ) : (
          <>
            <div className="tile-grid" role="list">
              {activeItems.map((item) => {
                const color = getTileColor(item.category?.name);
                return (
                  <button
                    key={item.id}
                    role="listitem"
                    aria-label={`${item.name} abhaken`}
                    className="tile"
                    style={{ '--tile-color': color } as React.CSSProperties}
                    onClick={() => handleTap(item)}
                    onPointerDown={() => onPointerDown(item.id)}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                  >
                    <span className="tile__dot" aria-hidden="true" />
                    <span className="tile__name">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="tile__qty">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                    )}
                    {item.status === 'LOW' && (
                      <span className="tile__badge tile__badge--low" aria-label="fast leer">!</span>
                    )}
                  </button>
                );
              })}
            </div>

            {doneItems.length > 0 && (
              <section className="tile-done-section">
                <p className="tile-done-label">Erledigt ({doneItems.length})</p>
                <ul className="tile-done-list" role="list">
                  {doneItems.map((item) => (
                    <li key={item.id} className="tile-done-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                      <span>{item.name}</span>
                      <button
                        className="tile-done-undo"
                        onClick={() => handleUncheck(item)}
                        aria-label={`${item.name} zurücklegen`}
                      >
                        ↩
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <a href="/items/new" className="fab" aria-label="Neuen Artikel hinzufügen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        </a>
      </div>

      {/* Toast-Container außerhalb tile-screen, damit Stacking-Context stimmt */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
