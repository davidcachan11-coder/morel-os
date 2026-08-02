import { trackBatchInput, recordEvents } from "@/server/analytics/track";

/**
 * Customer Intelligence & Growth Analytics — beacon ingestion endpoint.
 * navigator.sendBeacon() is the only reliable way to flush an event when a
 * tab is closing/hiding (SECTION_DWELL's durationMs, in particular), but
 * sendBeacon can only POST a Blob/string to a plain URL — it cannot go
 * through tRPC's httpLink. This route shares eventsRouter.track's exact
 * validation/insert logic (server/analytics/track.ts) so the two entry
 * points can't drift, but is otherwise a plain fetch handler, not tRPC.
 *
 * Always resolves customerId to null: sendBeacon carries no cookies
 * reliably across browsers in every case, and paying for two Auth.js
 * lookups (customer + staff instances) on every tab-hide beacon isn't
 * worth it for what's specifically anonymous dwell-time telemetry —
 * ADD_TO_CART/CHECKOUT_STARTED/PURCHASE_COMPLETED (where customer
 * attribution actually matters) go through eventsRouter.track instead,
 * never this route.
 *
 * Returns 204 unconditionally on parse/validation failure too — a
 * malformed beacon body must never surface as a visible error, and the
 * sender (lib/analytics-client.ts) never reads the response body anyway.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body: unknown = await req.json();
    const events = trackBatchInput.parse(body);
    await recordEvents(events, null);
  } catch {
    // Best-effort telemetry — swallow and still return success so the
    // browser doesn't retry a beacon it already considers delivered.
  }
  return new Response(null, { status: 204 });
}
