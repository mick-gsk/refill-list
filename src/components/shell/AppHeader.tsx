'use client';
/**
 * Sticky App-Header:
 * - Haushalt-Name links
 * - Avatar / User-Name rechts
 * Gleiche Höhe 56px → safe-area-aware.
 */
import { useEffect, useState } from 'react';

export function AppHeader({
  householdName,
  userName,
}: {
  householdName: string | null;
  userName: string | null;
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = document.documentElement.getAttribute('data-theme');
    setIsDark(
      stored === 'dark' ||
        (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches),
    );
  }, []);

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setIsDark(!isDark);
  }

  const initial = (userName ?? householdName ?? '?')[0].toUpperCase();

  return (
    <header className="app-header">
      {/* Logo + Haushalt-Name */}
      <div className="app-header__brand">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-label="refill" role="img">
          <circle cx="13" cy="13" r="13" fill="var(--color-primary)" />
          <path d="M8 10h4a3 3 0 0 1 0 6H8V10z" fill="white" />
          <path d="M14.5 16l3 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="18" cy="9" r="2" fill="var(--color-primary-highlight)" />
        </svg>
        <span className="app-header__name">
          {householdName ?? 'refill'}
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
          className="icon-btn"
        >
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
        <div className="app-header__avatar" aria-label={`Eingeloggt als ${userName}`}>
          {initial}
        </div>
      </div>
    </header>
  );
}
