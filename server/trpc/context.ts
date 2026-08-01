import "server-only";

import type { Role } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { auth as authStaff } from "@/server/auth/staff";
import { auth as authCustomer } from "@/server/auth/customer";

export interface TRPCSession {
  userId: string;
  role: Role;
}

/**
 * Per-request tRPC context. There are two separate Auth.js instances
 * (server/auth/customer.ts, server/auth/staff.ts), each with its own
 * cookie namespace — this is the one place their sessions are normalized
 * into a single shape every procedure can check uniformly, without the
 * two instances themselves being merged or made aware of each other.
 *
 * Staff is checked first: a staff session carries a real `role` (any of
 * the 10 values in the Role enum); a customer session is always exactly
 * CUSTOMER by construction (server/auth/customer.ts's adapter only ever
 * creates CUSTOMER-role users), so it's hardcoded here rather than
 * threaded through the customer session the way role is threaded through
 * the staff one — nothing to derive, nothing that could drift.
 *
 * In practice a single browser only ever carries one of the two session
 * cookies at a time (customers use /cuenta, staff use /admin), so the
 * ordering is a tie-break for a case that shouldn't occur, not a security
 * decision — server-side role enforcement (protectedProcedure, below)
 * doesn't depend on which one wins.
 */
export async function createContext() {
  const [staffSession, customerSession] = await Promise.all([
    authStaff(),
    authCustomer(),
  ]);

  let session: TRPCSession | null = null;
  if (staffSession?.user?.id && staffSession.user.role) {
    session = { userId: staffSession.user.id, role: staffSession.user.role };
  } else if (customerSession?.user?.id) {
    session = { userId: customerSession.user.id, role: "CUSTOMER" };
  }

  return {
    prisma,
    requestId: crypto.randomUUID(),
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
