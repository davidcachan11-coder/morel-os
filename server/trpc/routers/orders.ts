import "server-only";

import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc/trpc";

/**
 * Read-only, customer-facing. Mirrors services/orders.ts's getOrder(id)
 * shape — the contract Sprint 4 cuts over to a real tRPC call. No
 * mutations (saveOrder/checkout is Sprint 4), no payment data (Sprint 6),
 * no admin/ops-wide listing.
 *
 * Deliberately no "list orders for a customer" procedure: without a real
 * session (Sprint 5), there is no safe way to scope such a query to "the
 * caller's own orders" — accepting a customerId as a plain input would let
 * anyone enumerate any customer's order history. getOrder(id) is safe to
 * expose unauthenticated because it matches the app's existing behavior
 * today: /pedido/[id] is already a public, unauthenticated tracking link
 * (the order id functions like a tracking number), not a new decision
 * introduced here.
 */
export const ordersRouter = router({
  getOrder: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => {
      return ctx.prisma.order.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          createdAt: true,
          address: true,
          subtotal: true,
          deliveryFee: true,
          total: true,
          deliverySlot: {
            select: {
              id: true,
              dayLabel: true,
              dateLabel: true,
              timeRange: true,
              express: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              neverSubstitute: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  price: true,
                  emoji: true,
                  gradient: true,
                },
              },
            },
          },
          // Full history, oldest first — Sprint 4 replaces
          // hooks/use-order-progress.ts's wall-clock simulation with real
          // polling against this, so the tracking UI needs every stage
          // that has actually occurred, not just the current one.
          statusEvents: {
            orderBy: { createdAt: "asc" },
            select: {
              status: true,
              createdAt: true,
            },
          },
        },
      });
    }),
});
