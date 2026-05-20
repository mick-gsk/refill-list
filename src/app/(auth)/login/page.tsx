'use client';
import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') ?? '/';
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await signIn('credentials', {
        email: fd.get('email'),
        password: fd.get('password'),
        redirect: false,
      });
      if (res?.error) {
        setError('E-Mail oder Passwort falsch.');
      } else {
        router.replace(from);
      }
    });
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-6)' }}>
          Anmelden
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Field label="E-Mail" name="email" type="email" autoComplete="email" />
          <Field label="Passwort" name="password" type="password" autoComplete="current-password" />

          {error && (
            <p role="alert" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={isPending} style={btnPrimary}>
            {isPending ? 'Wird angemeldet …' : 'Anmelden'}
          </button>
        </form>

        <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Noch kein Konto?{' '}
          <Link href="/register" style={{ color: 'var(--color-primary)' }}>Registrieren</Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, name, type, autoComplete }: { label: string; name: string; type: string; autoComplete?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label htmlFor={name} style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</label>
      <input
        id={name} name={name} type={type} autoComplete={autoComplete} required
        style={inputStyle}
      />
    </div>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 'var(--space-4)', background: 'var(--color-bg)',
};
const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: '400px',
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
  boxShadow: 'var(--shadow-md)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 'var(--space-3)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)', background: 'var(--color-surface-2)',
  color: 'var(--color-text)',
};
const btnPrimary: React.CSSProperties = {
  padding: 'var(--space-3)', background: 'var(--color-primary)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)',
  fontWeight: 500, cursor: 'pointer', minHeight: '44px',
};
