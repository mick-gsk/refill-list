'use client';
/**
 * Hook für globalen Toast-State (RL-02, Habit Loop R3).
 * Liefert showToast() und die aktive Toast-Liste.
 */
import { useState, useCallback } from 'react';
import type { ToastMessage, ToastVariant } from './Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
