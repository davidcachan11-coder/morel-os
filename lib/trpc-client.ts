import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/server/trpc/root";

/**
 * Vanilla (non-React-Query) tRPC client. Callable from plain async
 * functions — used by services/orders.ts, which must stay a set of
 * imperative functions rather than hooks. See docs/DECISIONS.md's
 * tRPC client-architecture entry for why this was chosen over
 * @trpc/tanstack-react-query.
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [httpLink({ url: "/api/trpc" })],
});
