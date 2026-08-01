import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";
import type { Role } from "@prisma/client";
import type { Context } from "@/server/trpc/context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;

/** No role requirement — safe to call without any session at all. */
export const publicProcedure = t.procedure;

/**
 * Role-aware procedure. Every procedure that needs an authenticated
 * caller MUST go through this — per ENGINEERING_STANDARDS.md §5, a
 * procedure's required role(s) are declared up front, not left implicit.
 *
 * `protectedProcedure()` with no arguments means "any authenticated
 * session, any role" — a caller still needs a real session (customer or
 * staff), just not a specific one. `protectedProcedure("ADMIN", "HR")`
 * additionally requires the caller's role to be one of those listed.
 *
 * Fails closed at every step, matching SECURITY_ARCHITECTURE.md §2: no
 * session → UNAUTHORIZED before any role check runs; a session with a
 * role not in the allowed list → FORBIDDEN. `branchId` scoping
 * (SECURITY_ARCHITECTURE.md §4.3) is deliberately not implemented here —
 * no branch-scoped procedure exists yet, and no staff `branchId` field
 * exists on `User` to derive it from (that's `Employee.branchId`,
 * deferred to Sprint 9+) — a later PR's job once a second branch and a
 * real branch-scoped procedure both exist.
 */
export function protectedProcedure(...roles: Role[]) {
  return publicProcedure.use(
    middleware(({ ctx, next }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        });
      }
      if (roles.length > 0 && !roles.includes(ctx.session.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your role does not have access to this action.",
        });
      }
      return next({ ctx: { ...ctx, session: ctx.session } });
    })
  );
}
