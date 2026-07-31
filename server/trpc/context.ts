import "server-only";

import { prisma } from "@/server/db/client";

/**
 * Per-request tRPC context. Sprint 5 adds the authenticated session/user
 * and a server-derived branchId here (SECURITY_ARCHITECTURE.md §4.3 —
 * branchId must never be trusted from the client). Until then this stays
 * intentionally minimal: no session field exists yet, so nothing can
 * accidentally read a session that isn't really there.
 */
export async function createContext() {
  return {
    prisma,
    requestId: crypto.randomUUID(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
