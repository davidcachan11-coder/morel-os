import { router } from "@/server/trpc/trpc";
import { catalogRouter } from "@/server/trpc/routers/catalog";

/**
 * Merges domain routers (server/trpc/routers/*.ts, per
 * docs/BACKEND_ARCHITECTURE.md's folder structure) as they land. Only
 * catalogRouter exists so far (PR 5, read-only) — orders/inventory/
 * customers/etc. follow in later PRs.
 */
export const appRouter = router({
  catalog: catalogRouter,
});

export type AppRouter = typeof appRouter;
