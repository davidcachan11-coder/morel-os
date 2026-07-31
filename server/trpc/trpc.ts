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
 * Role-aware procedure stub. Every procedure that needs an authenticated
 * caller MUST go through this — per ENGINEERING_STANDARDS.md §5, a
 * procedure's required role(s) are declared up front, not left implicit.
 *
 * There is no session in Context yet (Sprint 5 adds Auth.js), so this
 * intentionally always fails closed rather than silently passing every
 * caller through. Declaring the roles now means the routers built in
 * Sprint 3/4 already carry their intended access control; Sprint 5 only
 * has to replace this one middleware's body with real session/role
 * verification, not touch every call site.
 */
export function protectedProcedure(...roles: Role[]) {
  return publicProcedure.use(
    middleware(() => {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: `protectedProcedure(${roles.join(
          ", "
        )}) is a stub — Auth.js session verification and role enforcement land in Sprint 5.`,
      });
    })
  );
}
