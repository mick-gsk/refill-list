/**
 * Artikel-Namens-Normalisierung (RL-20).
 * Serverseitig aufgerufen bei create/update.
 */

/**
 * Normalisiert einen Artikel-Namen für Duplikat-Erkennung.
 * @param name - Roher Eingabe-Name
 * @returns Normalisierter Name (lowercase, getrimmt, einfache Leerzeichen)
 */
export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFC')          // Unicode-Normalisierung
    .replace(/\s+/g, ' ')      // Mehrfache Leerzeichen
    .replace(/[^\w\s\u00C0-\u024F-]/g, ''); // Sonderzeichen entfernen, Umlaute behalten
}

/**
 * Einfaches Fuzzy-Match-Score zwischen zwei normalisierten Namen.
 * Gibt 0–1 zurück. ≥ 0.8 gilt als mögliches Duplikat.
 * @param a - Normalisierter Name A
 * @param b - Normalisierter Name B
 * @returns Ähnlichkeits-Score 0–1
 */
export function similarityScore(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i]![j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1]![j - 1]!
          : 1 + Math.min(matrix[i - 1]![j]!, matrix[i]![j - 1]!, matrix[i - 1]![j - 1]!);
    }
  }
  return matrix[b.length]![a.length]!;
}
