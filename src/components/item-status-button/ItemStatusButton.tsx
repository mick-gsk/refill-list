'use client';
/**
 * 1-Tap Statuswechsel-Button (RL-02).
 * Optimistic Update: Status wechselt sofort, Server Action im Hintergrund.
 * Touch Target >= 44px (RL-15).
 */
import { useState, useTransition } from 'react';
import type { ItemStatus } from '@/shared/types/index';
import { STATUS_TRANSITIONS, STATUS_COLORS, STATUS_LABELS } from '@/features/items/types';
import { updateItemStatus } from '@/features/items/actions';

interface ItemStatusButtonProps {
  itemId: string;
  householdId: string;
  initialStatus: ItemStatus;
  userId: string;
  /** Callback nach erfolgreichem Update — liefert neuen Status */
  onStatusChange?: (newStatus: ItemStatus) => void;
}

/**
 * Zyklusbutton: OK → LOW → EMPTY → OK.
 * Zeigt sofortiges visuelles Feedback (Optimistic Update).
 * Bei Fehler automatischer Rollback.
 */
export function ItemStatusButton({
  itemId,
  initialStatus,
  userId,
  onStatusChange,
}: ItemStatusButtonProps) {
  const [status, setStatus] = useState<ItemStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const nextStatus = STATUS_TRANSITIONS[status];
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  function handleClick() {
    const prevStatus = status;
    const optimisticNext = nextStatus;

    setStatus(optimisticNext); // Optimistic Update

    startTransition(async () => {
      const result = await updateItemStatus(
        { itemId, status: optimisticNext },
        { userId },
      );
      if (!result.success) {
        setStatus(prevStatus); // Rollback bei Fehler
      } else {
        onStatusChange?.(optimisticNext);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Status: ${label}. Tippen zum Wechseln auf ${STATUS_LABELS[nextStatus]}`}
      aria-pressed={status !== 'OK'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        minWidth: '44px',
        minHeight: '44px',
        padding: '0 var(--space-3)',
        borderRadius: 'var(--radius-full)',
        border: `1.5px solid ${color}`,
        color,
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        cursor: isPending ? 'wait' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        transition:
          'opacity var(--transition-interactive), border-color var(--transition-interactive), color var(--transition-interactive)',
        background: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <StatusDot status={status} />
      {label}
    </button>
  );
}

function StatusDot({ status }: { status: ItemStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}
