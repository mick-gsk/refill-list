/**
 * Root page — redirects to the main list view.
 * Placeholder until Auth + List-Feature implementiert sind.
 */
export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: '1rem',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>refill-list</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Architektur-Foundation bereit. Features folgen.</p>
    </main>
  );
}
