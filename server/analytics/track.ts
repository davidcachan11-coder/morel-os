import "server-only";

import { z } from "zod";
import { AnalyticsEventType, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

/**
 * Customer Intelligence & Growth Analytics — shared event-ingestion shape
 * and insert logic, used by both eventsRouter.track (tRPC, normal page
 * traffic) and app/api/track/route.ts (a plain POST endpoint, since
 * navigator.sendBeacon cannot go through tRPC's fetch link — see that
 * route's header comment). One validation schema, one insert path, so the
 * two entry points can't drift.
 *
 * createdAt is client-supplied and optional: a beacon fired at tab-hide
 * may be received by the server seconds after the moment it actually
 * happened (network delay, background tab throttling). When present, it
 * describes when the event occurred, not when the request arrived — the
 * database default is the fallback for the common case where that
 * distinction doesn't matter.
 */
export const trackedEventInput = z.object({
  type: z.nativeEnum(AnalyticsEventType),
  visitorId: z.string().min(1).max(200),
  sessionId: z.string().min(1).max(200),
  path: z.string().max(2048).optional(),
  categoryId: z.string().min(1).max(200).optional(),
  productId: z.string().min(1).max(200).optional(),
  searchQuery: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
});
export type TrackedEventInput = z.infer<typeof trackedEventInput>;

export const trackBatchInput = z.array(trackedEventInput).min(1).max(50);

/**
 * Inserts a batch of events as-is — no per-row try/catch. A bad
 * categoryId/productId (a foreign key violation) fails the whole
 * createMany call; that's treated as a genuine bug/tampering signal, not
 * an expected occurrence, since the client only ever sends ids it received
 * from real server-rendered catalog data. Callers (the tRPC mutation, the
 * beacon route) are expected to swallow the resulting error rather than
 * surface it to the visitor — analytics ingestion must never break the
 * storefront/checkout flow it's observing.
 *
 * customerId is resolved by the caller from its own session context
 * (never trusted from client input) and applied uniformly to every event
 * in the batch — a single trackBatch call originates from one browser
 * session, so it can only ever resolve to one customer (or none).
 */
export async function recordEvents(
  events: TrackedEventInput[],
  customerId: string | null
): Promise<void> {
  await prisma.analyticsEvent.createMany({
    data: events.map((event) => ({
      type: event.type,
      visitorId: event.visitorId,
      sessionId: event.sessionId,
      path: event.path,
      categoryId: event.categoryId,
      productId: event.productId,
      searchQuery: event.searchQuery,
      // z.record(z.string(), z.unknown()) is structurally a plain object
      // by the time it reaches here (parsed from JSON, either over HTTP
      // or via tRPC), so it's always JSON-safe in practice — the cast
      // reconciles zod's `unknown` values with Prisma's stricter
      // InputJsonValue, it doesn't change runtime behavior.
      metadata: event.metadata as Prisma.InputJsonValue | undefined,
      customerId,
      ...(event.createdAt ? { createdAt: new Date(event.createdAt) } : {}),
    })),
  });
}
