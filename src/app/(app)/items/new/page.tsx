/**
 * /items/new — AddItem-Formular mit Duplikat-Warnung (RL-07).
 * Zeigt ähnliche Artikel live beim Tippen (Levenshtein >= 0.7).
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { AddItemForm } from '@/components/add-item-form/AddItemForm';
import type { Category } from '@/shared/types/index';

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const householdId = (session as { householdId?: string | null }).householdId;
  if (!householdId) redirect('/');

  const [categories, existingItems] = await Promise.all([
    db.category.findMany({ orderBy: { name: 'asc' } }) as Promise<Category[]>,
    db.item.findMany({
      where: { householdId },
      select: { id: true, name: true, normalizedName: true },
    }),
  ]);

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: 'var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
        Artikel hinzufügen
      </h1>
      <AddItemForm
        householdId={householdId}
        userId={session.user.id}
        categories={categories}
        existingItems={existingItems as { id: string; name: string; normalizedName: string }[]}
      />
    </div>
  );
}
