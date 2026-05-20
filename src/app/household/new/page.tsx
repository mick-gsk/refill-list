'use client';
/**
 * Onboarding: Haushalt erstellen.
 * POST → /api/household
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewHouseholdPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Erstellen');
      setInviteToken(data.inviteToken);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (inviteToken) {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/household/join?token=${inviteToken}`;
    return (
      <div className="onboarding-screen">
        <div className="onboarding-icon" aria-hidden="true">✅</div>
        <h1 className="onboarding-title">Haushalt erstellt!</h1>
        <p className="onboarding-subtitle">Teile diesen Link, um Mitglieder einzuladen:</p>
        <div className="invite-link-box">
          <code className="invite-link-text">{link}</code>
          <button
            className="btn btn-secondary"
            onClick={() => navigator.clipboard.writeText(link)}
          >
            Kopieren
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/')}>Zur Liste</button>
      </div>
    );
  }

  return (
    <div className="onboarding-screen">
      <div className="onboarding-icon" aria-hidden="true">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="28" fill="var(--color-primary-highlight)"/>
          <path d="M20 24h6a6 6 0 0 1 0 12h-6V24z" fill="var(--color-primary)"/>
          <path d="M28 34l5 7" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h1 className="onboarding-title">Haushalt erstellen</h1>
      <p className="onboarding-subtitle">Gib deinem Haushalt einen Namen.</p>
      <form onSubmit={handleSubmit} className="onboarding-form">
        <label htmlFor="hh-name" className="form-label">Haushalt-Name</label>
        <input
          id="hh-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Familie Gottschalk"
          required
          minLength={1}
          maxLength={80}
          className="form-input"
          autoFocus
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading || !name.trim()} className="btn btn-primary">
          {loading ? 'Wird erstellt…' : 'Erstellen'}
        </button>
      </form>
    </div>
  );
}
