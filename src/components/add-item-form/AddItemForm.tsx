'use client';
/**
 * AddItem-Formular (RL-07).
 * - Live-Duplikat-Warnung ab 0.75 Ähnlichkeit beim Tippen
 * - Kategorie-Auswahl
 * - isStandard-Toggle
 * - Server Action createItem()
 */
import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createItem } from '@/features/items/actions';
import { normalizeItemName, similarityScore } from '@/shared/models/normalization';
import type { Category } from '@/shared/types/index';

const DUPLICATE_THRESHOLD = 0.75;

interface AddItemFormProps {
  householdId: string;
  userId: string;
  categories: Category[];
  existingItems: { id: string; name: string; normalizedName: string }[];
}

export function AddItemForm({ householdId, userId, categories, existingItems }: AddItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isStandard, setIsStandard] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<{ id: string; name: string }[]>([]);

  // Live-Duplikat-Check
  const checkDuplicates = useCallback(
    (value: string) => {
      if (value.trim().length < 2) { setDuplicates([]); return; }
      const norm = normalizeItemName(value);
      const matches = existingItems
        .filter((i) => similarityScore(norm, i.normalizedName) >= DUPLICATE_THRESHOLD)
        .map((i) => ({ id: i.id, name: i.name }));
      setDuplicates(matches);
    },
    [existingItems]
  );

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    checkDuplicates(e.target.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    startTransition(async () => {
      const result = await createItem(
        {
          name: name.trim(),
          categoryId: categoryId || undefined,
          isStandard,
        },
        householdId,
        { userId }
      );
      if (!result.success) {
        setServerError(result.error);
      } else {
        router.push('/items');
      }
    });
  }

  const hasDuplicates = duplicates.length > 0;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Name */}
      <div style={fieldWrap}>
        <label htmlFor="name" style={labelStyle}>Name *</label>
        <input
          id="name" name="name" type="text" required
          value={name} onChange={handleNameChange}
          placeholder="z. B. Vollmilch"
          aria-describedby={hasDuplicates ? 'duplicate-hint' : undefined}
          style={{
            ...inputStyle,
            borderColor: hasDuplicates ? 'var(--color-warning)' : 'var(--color-border)',
          }}
        />

        {/* Duplikat-Warnung (RL-07) */}
        {hasDuplicates && (
          <div
            id="duplicate-hint"
            role="alert"
            style={{
              padding: 'var(--space-3)',
              background: 'var(--color-warning-highlight)',
              border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
            }}
          >
            <p style={{ fontWeight: 500, color: 'var(--color-warning)', marginBottom: 'var(--space-1)' }}>
              Ähnliche Artikel vorhanden:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {duplicates.map((d) => (
                <li key={d.id} style={{ color: 'var(--color-text)' }}>· {d.name}</li>
              ))}
            </ul>
            <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
              Trotzdem fortfahren?
            </p>
          </div>
        )}
      </div>

      {/* Kategorie */}
      <div style={fieldWrap}>
        <label htmlFor="category" style={labelStyle}>Kategorie</label>
        <select
          id="category" name="category" value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Keine Kategorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Standardartikel-Toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
        <input
          type="checkbox" name="isStandard" checked={isStandard}
          onChange={(e) => setIsStandard(e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
        />
        <span style={{ fontSize: 'var(--text-base)' }}>
          Standardartikel
          <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Immer in der Haushaltsplanung berücksichtigen
          </span>
        </span>
      </label>

      {/* Server-Fehler */}
      {serverError && (
        <p role="alert" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>
          {serverError}
        </p>
      )}

      {/* Aktionen */}
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={btnSecondary}
        >
          Abbrechen
        </button>
        <button type="submit" disabled={isPending || name.trim().length === 0} style={btnPrimary}>
          {isPending ? 'Wird gespeichert …' : 'Hinzufügen'}
        </button>
      </div>
    </form>
  );
}

const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' };
const labelStyle: React.CSSProperties = { fontSize: 'var(--text-sm)', fontWeight: 500 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 'var(--space-3)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)', background: 'var(--color-surface-2)', color: 'var(--color-text)',
};
const btnPrimary: React.CSSProperties = {
  flex: 1, padding: 'var(--space-3)',
  background: 'var(--color-primary)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)', fontWeight: 500,
  cursor: 'pointer', minHeight: '44px',
  opacity: 1,
};
const btnSecondary: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  background: 'none', color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)', cursor: 'pointer', minHeight: '44px',
};
