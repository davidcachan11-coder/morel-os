import "server-only";

import { z } from "zod";
import { AnalyticsEventType } from "@prisma/client";
import { publicProcedure, protectedProcedure, router } from "@/server/trpc/trpc";
import { trackBatchInput, recordEvents } from "@/server/analytics/track";
import {
  syncCartInput,
  recoverCartInput,
  syncCartSnapshot,
  markCartRecovered,
} from "@/server/analytics/cart-snapshot";
import { ANALYTICS_PERIODS, resolvePeriodRanges } from "@/server/analytics/period";
import type { Context } from "@/server/trpc/context";

/**
 * Resolves the calling customer's Customer.id from the tRPC session
 * context, never from client input — a visitor can claim any visitorId
 * (that's expected, it's their own client-generated identity), but must
 * not be able to attribute an event to someone else's Customer row.
 * Staff sessions (ctx.session.role !== "CUSTOMER") never resolve to a
 * customerId here — this table tracks storefront visitor behavior, not
 * staff activity in /admin.
 */
async function resolveCustomerId(ctx: Context): Promise<string | null> {
  if (!ctx.session || ctx.session.role !== "CUSTOMER") return null;
  const customer = await ctx.prisma.customer.findUnique({
    where: { userId: ctx.session.userId },
    select: { id: true },
  });
  return customer?.id ?? null;
}

/**
 * Customer Intelligence & Growth Analytics — event ingestion. Public: the
 * overwhelming majority of storefront traffic is unauthenticated visitors,
 * and tracking is exactly the thing that must work before any account
 * exists. Read-side (funnel/abandonment/segmentation) queries land in a
 * later PR under their own staff-gated procedures, matching
 * analyticsRouter's protectedProcedure() pattern.
 *
 * No rate limiting yet — same gap analyticsRouter/ordersRouter's public
 * procedures already have (docs/PROJECT_STATUS.md's pending-modules list);
 * Upstash is the chosen fix (BACKEND_ARCHITECTURE.md §1.7) but has no
 * sprint assignment, so not introduced speculatively here.
 */
export const eventsRouter = router({
  track: publicProcedure.input(trackBatchInput).mutation(async ({ ctx, input }) => {
    const customerId = await resolveCustomerId(ctx);
    await recordEvents(input, customerId);
    return { ok: true as const };
  }),

  // Cart Abandonment foundation — called (debounced, client-side) on
  // every cart-store change, same customerId-resolution rule as track.
  syncCart: publicProcedure.input(syncCartInput).mutation(async ({ ctx, input }) => {
    const customerId = await resolveCustomerId(ctx);
    await syncCartSnapshot(input.visitorId, customerId, input.items);
    return { ok: true as const };
  }),

  // Fired once, immediately, from the checkout success path — never
  // debounced or batched, unlike syncCart, so it reliably lands before
  // the empty-cart syncCart that clearCart() triggers moments later.
  recoverCart: publicProcedure.input(recoverCartInput).mutation(async ({ input }) => {
    await markCartRecovered(input.visitorId, input.orderId);
    return { ok: true as const };
  }),

  /**
   * Ecommerce Funnel Analytics. Internal-classification (staff-only, any
   * role) — same protectedProcedure() pattern as analyticsRouter.
   *
   * Each stage's count is "distinct visitors who reached at least this
   * stage in the period" — a stage-reach count, not a strict ordered
   * funnel (this doesn't verify a purchaser was also counted at every
   * earlier stage via one joined path; a visitor whose PRODUCT_VIEW
   * happened just before the period boundary but whose ADD_TO_CART
   * landed just after it would still count at both stages independently).
   * Honest at this app's current traffic volume, and consistent with
   * getTopProducts/getCategoryPerformance's own "real query, clearly
   * labeled where it's an approximation" precedent — a truly ordered,
   * per-visitor sequence-verified funnel would need a session-scoped
   * self-join, not justified before real traffic volume exists.
   *
   * Cart/checkout abandonment rates ARE exact set differences (visitors
   * who reached that stage minus those in the same window who also
   * reached PURCHASE_COMPLETED), not a count subtraction — the two counts
   * alone can't safely be subtracted (the same visitor set isn't
   * guaranteed, and a cross-period purchaser would make it go negative).
   */
  getFunnel: protectedProcedure()
    .input(z.object({ period: z.enum(ANALYTICS_PERIODS).default("30d") }))
    .query(async ({ ctx, input }) => {
      const { current } = resolvePeriodRanges(input.period);
      const where = { createdAt: { gte: current.start, lt: current.end } };

      async function visitorSet(type?: AnalyticsEventType): Promise<Set<string>> {
        const rows = await ctx.prisma.analyticsEvent.findMany({
          where: type ? { ...where, type } : where,
          select: { visitorId: true },
          distinct: ["visitorId"],
        });
        return new Set(rows.map((r) => r.visitorId));
      }

      const [visitors, productViews, addToCart, checkoutStarted, purchases] = await Promise.all([
        visitorSet(),
        visitorSet("PRODUCT_VIEW"),
        visitorSet("ADD_TO_CART"),
        visitorSet("CHECKOUT_STARTED"),
        visitorSet("PURCHASE_COMPLETED"),
      ]);

      function countNotIn(a: Set<string>, b: Set<string>): number {
        let n = 0;
        for (const v of a) if (!b.has(v)) n++;
        return n;
      }

      const stages = [
        { id: "visitor", label: "Visitantes", count: visitors.size },
        { id: "product_view", label: "Vieron un producto", count: productViews.size },
        { id: "add_to_cart", label: "Agregaron al carrito", count: addToCart.size },
        { id: "checkout_started", label: "Iniciaron el pago", count: checkoutStarted.size },
        { id: "purchase_completed", label: "Compraron", count: purchases.size },
      ];

      const withRates = stages.map((stage, i) => ({
        ...stage,
        // null (not 0%) when there's no visitor baseline at all — matches
        // computeDeltaPct's "don't fabricate a comparison" contract.
        conversionFromStartPct: visitors.size > 0 ? (stage.count / visitors.size) * 100 : null,
        dropOffFromPrevious: i > 0 ? stages[i - 1].count - stage.count : 0,
      }));

      const cartAbandonedCount = countNotIn(addToCart, purchases);
      const checkoutAbandonedCount = countNotIn(checkoutStarted, purchases);

      return {
        period: input.period,
        range: current,
        stages: withRates,
        cartAbandonment: {
          abandonedCount: cartAbandonedCount,
          ratePct: addToCart.size > 0 ? (cartAbandonedCount / addToCart.size) * 100 : null,
        },
        checkoutAbandonment: {
          abandonedCount: checkoutAbandonedCount,
          ratePct: checkoutStarted.size > 0 ? (checkoutAbandonedCount / checkoutStarted.size) * 100 : null,
        },
      };
    }),

  /**
   * Cart Abandonment foundation — the current backlog of abandoned carts
   * (CartSnapshot rows with recoveredAt: null), oldest-first (the ones
   * most overdue for a future recovery campaign). items is a denormalized
   * JSON snapshot (server/analytics/cart-snapshot.ts) — resolved against
   * live Product data here for display, same "join after the fact" shape
   * ordersRouter already uses for its own item lists, not stored
   * redundantly on the snapshot itself.
   */
  getAbandonedCarts: protectedProcedure()
    .input(z.object({ limit: z.number().int().positive().max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const snapshots = await ctx.prisma.cartSnapshot.findMany({
        where: { recoveredAt: null },
        orderBy: { updatedAt: "asc" },
        take: input.limit,
        select: {
          id: true,
          visitorId: true,
          items: true,
          updatedAt: true,
          customer: { select: { user: { select: { name: true, email: true } } } },
        },
      });

      type SnapshotItem = { productId: string; quantity: number; neverSubstitute: boolean };
      const itemsByShapshotId = new Map(
        snapshots.map((s) => [s.id, s.items as unknown as SnapshotItem[]])
      );
      const productIds = [
        ...new Set(snapshots.flatMap((s) => itemsByShapshotId.get(s.id)!.map((i) => i.productId))),
      ];
      const products =
        productIds.length > 0
          ? await ctx.prisma.product.findMany({
              where: { id: { in: productIds } },
              select: { id: true, name: true, price: true, emoji: true },
            })
          : [];
      const productById = new Map(products.map((p) => [p.id, p]));

      return snapshots.map((s) => {
        const items = itemsByShapshotId.get(s.id)!.map((item) => {
          const product = productById.get(item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            neverSubstitute: item.neverSubstitute,
            // A product removed from the catalog since this cart was
            // abandoned is a real, if unlikely, case — surfaced honestly
            // rather than silently dropped from the list.
            name: product?.name ?? "Producto ya no disponible",
            price: product ? Number(product.price) : null,
            emoji: product?.emoji ?? "❓",
          };
        });
        const estimatedValue = items.reduce(
          (sum, i) => sum + (i.price ?? 0) * i.quantity,
          0
        );
        return {
          id: s.id,
          visitorId: s.visitorId,
          customerName: s.customer?.user.name ?? s.customer?.user.email ?? null,
          items,
          estimatedValue,
          abandonedSince: s.updatedAt,
          minutesSinceAbandonment: Math.floor((Date.now() - s.updatedAt.getTime()) / 60_000),
        };
      });
    }),
});
