'use client';
/**
 * Onboarding: Haushalt via Einladungslink beitreten.
 * Liest token aus Query-Param, sendet POST → /api/household/join
 */
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token') ?? '';

  const [token, setToken] = useState(tokenFromUrl);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setToken(tokenFromUrl); }, [tokenFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/household/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...(nickname ? { nickname } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Beitreten');
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding-screen">
      <div className="onboarding-icon" aria-hidden="true">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="28" fill="var(--color-primary-highlight)"/>
          <path d="M18 28h20M30 20l8 8-8 8" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h1 className="onboarding-title">Haushalt beitreten</h1>
      <p className="onboarding-subtitle">Gib deinen Einladungstoken ein oder öffne den Link direkt.</p>
      <form onSubmit={handleSubmit} className="onboarding-form">
        <label htmlFor="join-token" className="form-label">Einladungstoken</label>
        <input
          id="join-token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token aus dem Einladungslink"
          required
          className="form-input"
        />
        <label htmlFor="join-nick" className="form-label">Spitzname (optional)</label>
        <input
          id="join-nick"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="z.B. Mama, Papa, …"
          maxLength={40}
          className="form-input"
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading || !token.trim()} className="btn btn-primary">
          {loading ? 'Beitreten…' : 'Beitreten'}
        </button>
      </form>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="onboarding-screen"><p>Lade…</p></div>}>
      <JoinForm />
    </Suspense>
  );
}
