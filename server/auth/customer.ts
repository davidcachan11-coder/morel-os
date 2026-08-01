import "server-only";

import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db/client";

/**
 * Customer-facing Auth.js instance (BACKEND_ARCHITECTURE.md §6): Google
 * OAuth + email magic link, JWT sessions. Mounted at its own basePath with
 * a distinct cookie prefix so the staff-facing instance (PR3 — credentials,
 * database sessions) can be added later without any collision, per the
 * two-instance session-strategy design in docs/DECISIONS.md's "Sprint 5
 * PR2" entry.
 *
 * The default PrismaAdapter.createUser doesn't set `role` (it only knows
 * about Auth.js's own AdapterUser shape), but our User.role is required
 * with no default — a brand-new sign-up would violate that NOT NULL
 * constraint. This wrapper is the fix: every user this instance creates is
 * a CUSTOMER, since this instance is never used for staff sign-in.
 */
function customerAdapter(): Adapter {
  const adapter = PrismaAdapter(prisma);
  return {
    ...adapter,
    createUser: async ({ id, ...data }) => {
      // Discard Auth.js's generated id so Prisma's own @default(cuid())
      // applies instead — matching every other id in this schema, and the
      // same reasoning PrismaAdapter's own createUser already uses.
      void id;
      return prisma.user.create({ data: { ...data, role: "CUSTOMER" } });
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: customerAdapter(),
  basePath: "/api/auth/customer",
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/cuenta/ingresar",
  },
  cookies: {
    sessionToken: { name: "morel.customer.session-token" },
    callbackUrl: { name: "morel.customer.callback-url" },
    csrfToken: { name: "morel.customer.csrf-token" },
  },
  providers: [
    Google({
      // Guest checkout (Sprint 4) auto-creates a User by email with no
      // Account row. A Google sign-in for that same, Google-verified email
      // should link to that existing row rather than error — see
      // docs/DECISIONS.md's "Sprint 5 PR2" entry for the full reasoning.
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      // Placeholder sender — must be a domain verified in Resend before
      // this can send real mail; not functional until that's configured.
      from: "Morel OS <no-reply@morel.local>",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
