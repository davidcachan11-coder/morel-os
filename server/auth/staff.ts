import "server-only";

import { randomUUID } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { hash, verify } from "@node-rs/argon2";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/server/db/client";
import {
  consumeRecoveryCode,
  decryptTotpSecret,
  staffRoleRequiresMfa,
  verifyTotpToken,
} from "@/server/auth/mfa";

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
 * Verifies a staff email/password pair, timing-safe against every failure
 * mode (see DUMMY_HASH_PROMISE above) — the shared core of authorize()
 * below, also used by app/admin/ingresar's pre-check server action so it
 * can decide whether to show the second-factor step without duplicating
 * this logic (and without duplicating its timing-safety properties, which
 * are easy to accidentally lose in a second implementation).
 *
 * Returns the full `User` row on success so callers can inspect role/MFA
 * state; returns `null` on any failure (no row, wrong password, customer
 * role, no password set).
 */
export async function verifyStaffPassword(
  email: string,
  password: string
): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } });

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
  return user;
}

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
 *
 * `adapter: PrismaAdapter(prisma)` below is NOT a reversal of that
 * decision and does NOT change session handling — `session.strategy`
 * stays `"jwt"`, so Auth.js's actual runtime session logic never touches
 * this adapter, and a Credentials-only provider never calls its
 * user/account methods either. It exists purely to satisfy
 * `@auth/core`'s `assertConfig`, which tracks whether *any* configured
 * provider across the whole process is type `"email"` in a
 * module-level, never-reset variable (`hasEmail` in `assert.ts`) — not
 * scoped per `NextAuth()` instance. The customer instance's Resend
 * (email) provider sets that flag process-wide the first time its own
 * config is asserted; every request to *this* instance afterward then
 * fails `assertConfig`'s "email login requires an adapter" check, even
 * though this instance has no email provider at all. Confirmed directly
 * against @auth/core's installed source (`hasEmail`/`hasCredentials`/
 * `hasWebAuthn` are declared with `let` outside `assertConfig`, only
 * ever set to `true`, never reset) and reproduced by hitting the
 * customer instance once, then this one, in the same process — see
 * docs/DECISIONS.md's "Runtime regression" entry for the full
 * investigation. Giving this instance an adapter that satisfies the
 * check makes it correct independent of which global flags an
 * unrelated sibling instance has already set — the only fix available
 * without patching a third-party package, and the durable one, since a
 * long-running server inevitably serves both instances over its
 * lifetime regardless of request order.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
        // Only one of these is ever sent by app/admin/ingresar's second
        // step — whichever the user chose (authenticator code vs. recovery
        // code) — see SECURITY_ARCHITECTURE.md §4.2.
        totpCode: { label: "Código de verificación", type: "text" },
        recoveryCode: { label: "Código de recuperación", type: "text" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : null;
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : null;
        const totpCode =
          typeof credentials?.totpCode === "string" &&
          credentials.totpCode.trim()
            ? credentials.totpCode.trim()
            : null;
        const recoveryCode =
          typeof credentials?.recoveryCode === "string" &&
          credentials.recoveryCode.trim()
            ? credentials.recoveryCode.trim()
            : null;
        if (!email || !password) return null;

        const user = await verifyStaffPassword(email, password);
        if (!user) return null;

        // SECURITY_ARCHITECTURE.md §4.2: an admin/finance/ops_manager
        // account that has completed MFA enrollment MUST clear a second
        // factor at every login. An account in one of those roles that
        // hasn't enrolled yet is intentionally let through here — it's
        // blocked from reaching anything except the enrollment page by
        // app/admin/(app)/layout.tsx instead, the same pattern already
        // used for mustChangePassword (see docs/DECISIONS.md's MFA entry
        // for why: enrollment itself needs an authenticated context to
        // bind the QR code to the right account).
        if (staffRoleRequiresMfa(user.role) && user.mfaEnabled) {
          if (!user.totpSecret) return null; // fail closed — inconsistent state, never trust it
          let secondFactorOk = false;
          if (recoveryCode) {
            secondFactorOk = await consumeRecoveryCode(user.id, recoveryCode);
          } else if (totpCode) {
            secondFactorOk = verifyTotpToken(
              decryptTotpSecret(user.totpSecret),
              totpCode
            );
          }
          if (!secondFactorOk) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          mustChangePassword: user.mustChangePassword,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
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
        token.role = user.role;
        token.mfaEnabled = user.mfaEnabled ?? false;
        return token;
      }

      if (typeof token.sessionToken !== "string") return null;
      // Re-read mustChangePassword/role/mfaEnabled fresh on every request,
      // not just at sign-in — the same query already needed for revocation
      // (below) also carries these, so a password change, role change, or
      // completed MFA enrollment (app/admin/configurar-mfa) takes effect on
      // the very next request with no re-login required.
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: token.sessionToken },
        include: {
          user: { select: { mustChangePassword: true, role: true, mfaEnabled: true } },
        },
      });
      if (!dbSession || dbSession.expires < new Date()) return null;
      token.mustChangePassword = dbSession.user.mustChangePassword;
      token.role = dbSession.user.role;
      token.mfaEnabled = dbSession.user.mfaEnabled;

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.mustChangePassword === "boolean") {
        session.user.mustChangePassword = token.mustChangePassword;
      }
      if (session.user && typeof token.role === "string") {
        session.user.role = token.role as Role;
      }
      if (session.user && typeof token.mfaEnabled === "boolean") {
        session.user.mfaEnabled = token.mfaEnabled;
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
