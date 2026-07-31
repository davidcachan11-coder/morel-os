import { router } from "@/server/trpc/trpc";
import { catalogRouter } from "@/server/trpc/routers/catalog";
import { ordersRouter } from "@/server/trpc/routers/orders";

/**
 * Merges domain routers (server/trpc/routers/*.ts, per
 * docs/BACKEND_ARCHITECTURE.md's folder structure) as they land.
 * inventory/customers/etc. follow in later PRs.
 */
export const appRouter = router({
  catalog: catalogRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
