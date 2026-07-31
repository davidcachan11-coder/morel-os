import { router } from "@/server/trpc/trpc";
import { catalogRouter } from "@/server/trpc/routers/catalog";
import { ordersRouter } from "@/server/trpc/routers/orders";
import { deliveryRouter } from "@/server/trpc/routers/delivery";

/**
 * Merges domain routers (server/trpc/routers/*.ts, per
 * docs/BACKEND_ARCHITECTURE.md's folder structure) as they land.
 * inventory/customers/payments/fiscal/etc. follow in later PRs — a
 * domain gets a router file the moment it has its first real procedure,
 * not before (no empty placeholder routers registered speculatively;
 * see PR 7's review discussion on customersRouter for why).
 */
export const appRouter = router({
  catalog: catalogRouter,
  orders: ordersRouter,
  delivery: deliveryRouter,
});

export type AppRouter = typeof appRouter;
