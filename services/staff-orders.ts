"use client";

import type { OrderStatus } from "@prisma/client";
import { trpcClient } from "@/lib/trpc-client";

/**
 * Admin-side mutation adapter, mirroring services/orders.ts's
 * tRPC-vanilla-client pattern (docs/DECISIONS.md's 2026-07-31
 * client-architecture entry) rather than a server action — this is a
 * real business mutation triggered by a button click, the same shape as
 * checkout's saveOrder, not an auth-form submission.
 *
 * Unlike services/orders.ts, this freely imports the Prisma `OrderStatus`
 * type — that file's decoupling-from-Prisma discipline is specifically
 * for the public customer bundle; the admin components this feeds
 * already import Prisma enum types directly (order-status-breakdown.tsx,
 * recent-activity-list.tsx), so there's no established boundary to
 * preserve here.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await trpcClient.orders.staff.updateStatus.mutate({ id: orderId, status });
}
