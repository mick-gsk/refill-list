/**
 * NextAuth.js v5 Konfiguration.
 * Provider: Credentials (E-Mail + Passwort) + optional Google.
 * Session-Strategie: JWT (kein DB-Session-Store nötig).
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.householdId = (user as { householdId?: string }).householdId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session as { householdId?: string | null }).householdId = token.householdId as string | null;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              select: { householdId: true },
              take: 1,
            },
          },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          householdId: user.memberships[0]?.householdId ?? null,
        };
      },
    }),
  ],
});
