import "server-only";

import { appRouter } from "@/server/trpc/root";
import { createContext } from "@/server/trpc/context";

/**
 * Server-side tRPC caller for React Server Components — invokes procedures
 * in-process against the current request's cookies/session, no HTTP round
 * trip. This is the "admin dashboard live KPIs" consumer
 * docs/DECISIONS.md's tRPC client-architecture entry (2026-07-31) already
 * anticipated as the trigger for a second tRPC access pattern alongside
 * lib/trpc-client.ts's vanilla browser client — still no
 * @trpc/tanstack-react-query, since a Server Component doesn't need
 * client-side caching/refetching at all.
 */
export async function createServerCaller() {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
}
