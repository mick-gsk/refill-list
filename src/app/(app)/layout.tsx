/**
 * App-Shell Layout für alle authentifizierten Seiten.
 * Enthält Bottom-Navigation (Mobile) + Sidebar (Desktop).
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* Top-Header */}
      <header style={headerStyle}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-primary)' }}>
          refill
        </span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          {session.user?.name ?? session.user?.email}
        </span>
      </header>

      {/* Hauptinhalt */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '72px' }}>
        {children}
      </main>

      {/* Bottom-Navigation (Mobile-first) */}
      <nav aria-label="Hauptnavigation" style={navStyle}>
        <NavItem href="/" icon={iconHome} label="Übersicht" />
        <NavItem href="/items" icon={iconList} label="Artikel" />
        <NavItem href="/week" icon={iconWeek} label="Woche" />
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} style={navItemStyle}>
      <span aria-hidden="true" style={{ fontSize: '20px' }}>{icon}</span>
      <span style={{ fontSize: 'var(--text-xs)' }}>{label}</span>
    </Link>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '1px solid var(--color-divider)',
  background: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 10,
};
const navStyle: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  display: 'flex', justifyContent: 'space-around',
  background: 'var(--color-surface)', borderTop: '1px solid var(--color-divider)',
  padding: 'var(--space-2) 0', zIndex: 20,
};
const navItemStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-4)',
  color: 'var(--color-text-muted)', textDecoration: 'none', minWidth: '56px', minHeight: '44px',
};

// Inline-SVG Icons
const iconHome = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
const iconList = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>;
const iconWeek = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
