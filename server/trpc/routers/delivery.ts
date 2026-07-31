import "server-only";

import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc/trpc";

/**
 * Read-only. DeliverySlot is genuinely public reference data — matches
 * data/delivery.ts's existing use in the checkout flow, shown before a
 * customer is identified in any way, same category as catalogRouter's
 * Category/Product. Driver and Delivery are NOT exposed here: both carry
 * either PII (Driver.user.name via the required User relation) or
 * order-specific detail that only makes sense scoped to an order the
 * caller already has access to — the same "no unscoped PII lookup"
 * reasoning applied to customersRouter and to orders in PR 6.
 *
 * Ordering note: DeliverySlot has no DateTime/sortable column
 * representing its intended chronological display order (today's slots
 * before tomorrow's, etc.) — dayLabel/dateLabel/timeRange are display
 * strings, not sortable dates. `orderBy: { id: "asc" }` gives a stable,
 * deterministic order (not "N/A", a real guarantee), and today happens to
 * roughly match insertion/seed order in practice — but that's an
 * incidental property of how the seed script inserts rows, not a
 * documented guarantee to build on. A real fix (a proper sortable column)
 * is a schema change, out of scope for this read-only router PR.
 */
export const deliveryRouter = router({
  listDeliverySlots: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.deliverySlot.findMany({
      select: {
        id: true,
        dayLabel: true,
        dateLabel: true,
        timeRange: true,
        capacity: true,
        spotsLeft: true,
        totalSpots: true,
        express: true,
      },
      orderBy: { id: "asc" },
    });
  }),

  getDeliverySlotById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) => {
      return ctx.prisma.deliverySlot.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          dayLabel: true,
          dateLabel: true,
          timeRange: true,
          capacity: true,
          spotsLeft: true,
          totalSpots: true,
          express: true,
        },
      });
    }),
});
