import "server-only";

import { randomUUID } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { hash, verify } from "@node-rs/argon2";
import { prisma } from "@/server/db/client";

// Absolute session lifetime. A placeholder initial value (roughly one work
// shift) — real idle-timeout/sliding-renewal policy (SECURITY_ARCHITECTURE.md
// §4.4) is deliberately deferred to a later PR, not decided here.
const STAFF_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

// Explicit, not library-default, argon2 parameters — @node-rs/argon2's own
// default (4 MiB memory) is below OWASP's current Password Storage Cheat
// Sheet baseline for Argon2id (>=19 MiB). Algorithm defaults to Argon2id
// already (the library's own recommended default), left unspecified here.
// Exported so app/admin/cambiar-contrasena's password-change action hashes
// with the exact same parameters (prisma/bootstrap-admin.ts duplicates
// this constant instead of importing it, since it runs outside Next's
// bundler and this module has a server-only guard).
export const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

// A fixed, validly-formatted (but unreachable) hash, verified against on
// every failed lookup so `authorize()` always pays argon2's real cost
// regardless of whether the email exists, has no password, or is a
// customer — otherwise those cases return near-instantly while a wrong
// password on a real staff account takes argon2's full verify time, a
// timing side-channel an attacker could use to enumerate valid staff
// emails. Generated once at module load from a random value never used
// as a real password.
const DUMMY_HASH_PROMISE = hash(randomUUID(), ARGON2_OPTIONS);

/**
 * Staff-facing Auth.js instance (BACKEND_ARCHITECTURE.md §6): credentials
 * only, mounted at its own basePath with a distinct cookie prefix from the
 * customer instance (server/auth/customer.ts) — zero collision risk.
 *
 * Session strategy is `jwt`, not `database`, despite SECURITY_ARCHITECTURE.md
 * §4.4 requiring individually, instantly revocable staff sessions. Auth.js's
 * own config validation (@auth/core's assertConfig) rejects
 * `session.strategy: "database"` when every provider is type "credentials" —
 * confirmed directly against @auth/core's source, not assumed. The actual
 * requirement (revocable, DB-backed) is met a different way: the existing,
 * previously-unused `Session` table is populated manually on sign-in, and
 * the `jwt` callback re-checks that row on every single request, returning
 * `null` (which Auth.js's own session-resolution code treats as "no
 * session") the moment the row is missing or expired. Deleting a `Session`
 * row therefore kills that session on its very next use — see
 * docs/DECISIONS.md's "Sprint 5 PR3" entry for the full reasoning.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/auth/staff",
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: STAFF_SESSION_MAX_AGE_SECONDS },
  trustHost: true,
  pages: {
    signIn: "/admin/ingresar",
  },
  cookies: {
    sessionToken: { name: "morel.staff.session-token" },
    callbackUrl: { name: "morel.staff.callback-url" },
    csrfToken: { name: "morel.staff.csrf-token" },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : null;
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : null;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        // Fail closed: no row, no password set (every customer row — the
        // customer instance never sets passwordHash), or a customer role
        // caught by this login surface some other way — none of these
        // authenticate here. The role check is a deliberate second,
        // redundant gate on top of "has a passwordHash at all"
        // (SECURITY_ARCHITECTURE.md §2's "defense in depth").
        //
        // Always verify against *something* — the real hash when the row
        // could possibly be a valid staff login, the fixed dummy hash
        // otherwise — so this function takes the same time either way and
        // doesn't leak which staff emails exist via response timing.
        let hashToVerify: string;
        let eligible: boolean;
        if (user && user.passwordHash && user.role !== "CUSTOMER") {
          hashToVerify = user.passwordHash;
          eligible = true;
        } else {
          hashToVerify = await DUMMY_HASH_PROMISE;
          eligible = false;
        }

        const valid = await verify(hashToVerify, password, ARGON2_OPTIONS);
        if (!eligible || !valid || !user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // authorize() above always returns a real Prisma id; this guard is
      // only to satisfy Auth.js's broader (optional) User.id type.
      if (user?.id) {
        const sessionToken = randomUUID();
        const expires = new Date(
          Date.now() + STAFF_SESSION_MAX_AGE_SECONDS * 1000
        );
        await prisma.session.create({
          data: { sessionToken, userId: user.id, expires },
        });
        token.sessionToken = sessionToken;
        token.id = user.id;
        token.mustChangePassword = user.mustChangePassword ?? false;
        return token;
      }

      if (typeof token.sessionToken !== "string") return null;
      // Re-read mustChangePassword fresh on every request, not just at
      // sign-in — the same query already needed for revocation (below)
      // also carries this, so a password change (app/admin/cambiar-contrasena)
      // takes effect on the very next request with no re-login required.
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: token.sessionToken },
        include: { user: { select: { mustChangePassword: true } } },
      });
      if (!dbSession || dbSession.expires < new Date()) return null;
      token.mustChangePassword = dbSession.user.mustChangePassword;

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.mustChangePassword === "boolean") {
        session.user.mustChangePassword = token.mustChangePassword;
      }
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      // "token" is only present for jwt-strategy sign-out; delete the
      // matching Session row so it doesn't linger until natural expiry.
      if ("token" in message && typeof message.token?.sessionToken === "string") {
        await prisma.session.deleteMany({
          where: { sessionToken: message.token.sessionToken },
        });
      }
    },
  },
});
