/**
 * Next.js Middleware — RL-19:
 * 1. Nicht-authentifizierte Requests → /login
 * 2. /household/join ist public (Onboarding)
 * 3. Alle übrigen App-Routen: Session muss gültig sein.
 *    Die Haushaltsmitgliedschaft wird nicht in der Middleware geprüft
 *    (zu teuer für Edge), sondern in jeder Route via requireActiveMember().
 */
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/auth',
  '/household/join',      // Einladungslink-Seite (Onboarding, braucht kein Haushalt)
  '/household/new',       // Haushalt-Erstell-Seite (Onboarding)
];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!req.auth && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
};
