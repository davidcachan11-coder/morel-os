import "server-only";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

/**
 * Cart Abandonment foundation — CartSnapshot read/write logic, shared by
 * eventsRouter's syncCart/recoverCart procedures. See prisma/schema.prisma's
 * CartSnapshot model comment for the "why a side-table, not derived from
 * the event log" reasoning.
 */
export const cartSnapshotItemInput = z.object({
  productId: z.string().min(1).max(200),
  quantity: z.number().positive(),
  neverSubstitute: z.boolean(),
});

export const syncCartInput = z.object({
  visitorId: z.string().min(1).max(200),
  items: z.array(cartSnapshotItemInput).max(200),
});

export const recoverCartInput = z.object({
  visitorId: z.string().min(1).max(200),
  orderId: z.string().min(1),
});

/**
 * Upserts (or, for an emptied cart, deletes) this visitor's single open
 * snapshot row. An empty cart never destroys an already-recovered row —
 * that row is now a short-lived historical record of the exact moment a
 * cart was abandoned and then recovered, not "current cart" cache
 * anymore, and the checkout flow's own clearCart() (which fires this same
 * sync with an empty cart moments after a purchase) must not erase it.
 *
 * A fresh, non-empty cart from the same long-lived visitorId always
 * clears any prior recoveredAt/recoveredOrderId — this table tracks one
 * "current cycle" per visitor, not a full historical audit log across
 * every cart this visitor has ever built.
 */
export async function syncCartSnapshot(
  visitorId: string,
  customerId: string | null,
  items: z.infer<typeof cartSnapshotItemInput>[]
): Promise<void> {
  if (items.length === 0) {
    await prisma.cartSnapshot.deleteMany({
      where: { visitorId, recoveredAt: null },
    });
    return;
  }

  await prisma.cartSnapshot.upsert({
    where: { visitorId },
    create: {
      visitorId,
      customerId,
      items: items as unknown as Prisma.InputJsonValue,
    },
    update: {
      customerId,
      items: items as unknown as Prisma.InputJsonValue,
      recoveredAt: null,
      recoveredOrderId: null,
    },
  });
}

/**
 * Marks this visitor's open snapshot as recovered. A no-op (0 rows
 * updated) if no snapshot exists for this visitorId — not expected in
 * practice (a checkout only ever completes with a non-empty cart, which
 * implies a synced snapshot already exists), but never worth failing the
 * checkout flow over.
 */
export async function markCartRecovered(visitorId: string, orderId: string): Promise<void> {
  await prisma.cartSnapshot.updateMany({
    where: { visitorId },
    data: { recoveredAt: new Date(), recoveredOrderId: orderId },
  });
}
