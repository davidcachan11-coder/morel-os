import { router } from "@/server/trpc/trpc";
import { catalogRouter } from "@/server/trpc/routers/catalog";
import { ordersRouter } from "@/server/trpc/routers/orders";
import { deliveryRouter } from "@/server/trpc/routers/delivery";
import { analyticsRouter } from "@/server/trpc/routers/analytics";
import { eventsRouter } from "@/server/trpc/routers/events";
import { customersRouter } from "@/server/trpc/routers/customers";

/**
 * Merges domain routers (server/trpc/routers/*.ts, per
 * docs/BACKEND_ARCHITECTURE.md's folder structure) as they land.
 * inventory/customers/payments/fiscal/etc. follow in later PRs — a
 * domain gets a router file the moment it has its first real procedure,
 * not before (no empty placeholder routers registered speculatively;
 * see PR 7's review discussion on customersRouter for why). `analytics` is
 * a deliberate addition beyond that documented list — cross-domain
 * reporting queries, not a single entity's own router; see
 * docs/DECISIONS.md's Admin Platform entry. `events` (Customer
 * Intelligence & Growth Analytics) is its own router rather than folded
 * into `analytics` because it's a genuinely different domain — an
 * event-ingestion log with a public write surface — not another
 * cross-domain reporting query over existing tables. `customers` is the
 * Customer domain's own list/detail read model (Customer Intelligence &
 * Growth Analytics) — the first real procedure for this domain, landing
 * now per the "a domain gets a router file the moment it has its first
 * real procedure, not before" rule this comment already states.
 */
export const appRouter = router({
  catalog: catalogRouter,
  orders: ordersRouter,
  delivery: deliveryRouter,
  analytics: analyticsRouter,
  events: eventsRouter,
  customers: customersRouter,
});

export type AppRouter = typeof appRouter;
