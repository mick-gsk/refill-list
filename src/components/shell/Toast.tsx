'use client';
/**
 * Toast-Notification für Statuswechsel-Feedback (RL-02, Habit Loop R3).
 * Erscheint bei EMPTY-Markierung: sofortige visuelle Bestätigung.
 */
import { useEffect } from 'react';

export type ToastVariant = 'empty' | 'low' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: string }> = {
  empty: { bg: 'var(--color-error)', icon: '🛒' },
  low: { bg: 'var(--color-warning, #da7101)', icon: '⚠️' },
  success: { bg: 'var(--color-success)', icon: '✓' },
  error: { bg: 'var(--color-notification)', icon: '✕' },
};

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--space-16) + var(--space-4))', // über FAB
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        zIndex: 9999,
        pointerEvents: 'none',
        width: 'min(calc(100vw - var(--space-8)), 360px)',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const { bg, icon } = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: bg,
        color: '#fff',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'auto',
        animation: 'toast-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Toast schließen"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
          padding: 'var(--space-1)',
          lineHeight: 1,
          fontSize: '1rem',
        }}
      >
        ✕
      </button>
    </div>
  );
}
