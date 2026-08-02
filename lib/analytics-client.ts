"use client";

import { trpcClient } from "@/lib/trpc-client";
import { STORAGE_KEYS } from "@/constants/storage";

// Mirrors the server's AnalyticsEventType enum (@prisma/client) as a
// plain string-literal union rather than importing the Prisma enum
// directly — same reasoning as services/orders.ts's mapOrderStatus: this
// client-side module stays decoupled from Prisma's generated types.
export type AnalyticsEventType =
  | "PAGE_VIEW"
  | "CATEGORY_VIEW"
  | "PRODUCT_VIEW"
  | "SECTION_DWELL"
  | "PRODUCT_INTERACTION"
  | "SEARCH"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "CHECKOUT_STARTED"
  | "PURCHASE_COMPLETED";

export interface TrackEventPayload {
  path?: string;
  categoryId?: string;
  productId?: string;
  searchQuery?: string;
  metadata?: Record<string, unknown>;
}

interface QueuedEvent extends TrackEventPayload {
  type: AnalyticsEventType;
  visitorId: string;
  sessionId: string;
  createdAt: string;
}

// Idle gap after which a returning visitor starts a new browsing session
// — a labeled, configurable default (same pattern as
// server/analytics/alerts.ts's thresholds), not a discovered constant.
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// How often batched (non-immediate) events flush automatically.
const FLUSH_INTERVAL_MS = 10_000;

// A dwell shorter than this is almost certainly an accidental
// open-and-bounce, not a meaningful "time spent in section" signal.
const MIN_DWELL_MS = 1_000;

// Funnel-critical, individually rare — flushed immediately (via the
// customer-aware tRPC mutation, never the anonymous beacon route) rather
// than waiting for the next batch interval, so a tab closing right after
// checkout starts can never lose one of these.
const IMMEDIATE_TYPES: ReadonlySet<AnalyticsEventType> = new Set([
  "ADD_TO_CART",
  "REMOVE_FROM_CART",
  "CHECKOUT_STARTED",
  "PURCHASE_COMPLETED",
]);

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let listenersAttached = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getVisitorId(): string {
  if (!isBrowser()) return "";
  let id = window.localStorage.getItem(STORAGE_KEYS.analyticsVisitor);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEYS.analyticsVisitor, id);
  }
  return id;
}

interface StoredSession {
  sessionId: string;
  lastActivityAt: number;
}

function getSessionId(): string {
  if (!isBrowser()) return "";
  const now = Date.now();
  const raw = window.localStorage.getItem(STORAGE_KEYS.analyticsSession);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as StoredSession;
      if (now - stored.lastActivityAt < SESSION_IDLE_TIMEOUT_MS) {
        const touched: StoredSession = { sessionId: stored.sessionId, lastActivityAt: now };
        window.localStorage.setItem(STORAGE_KEYS.analyticsSession, JSON.stringify(touched));
        return stored.sessionId;
      }
    } catch {
      // Corrupt/unexpected stored value — fall through to a fresh session.
    }
  }
  const fresh: StoredSession = { sessionId: crypto.randomUUID(), lastActivityAt: now };
  window.localStorage.setItem(STORAGE_KEYS.analyticsSession, JSON.stringify(fresh));
  return fresh.sessionId;
}

function flush(mode: "interval" | "beacon" | "immediate", events?: QueuedEvent[]): void {
  const batch = events ?? queue.splice(0, queue.length);
  if (batch.length === 0) return;

  if (mode === "beacon" && isBrowser() && "sendBeacon" in navigator) {
    const blob = new Blob([JSON.stringify(batch)], { type: "application/json" });
    if (navigator.sendBeacon("/api/track", blob)) return;
    // Browser rejected the beacon outright — fall through to the normal
    // mutation as a best-effort retry rather than dropping the batch.
  }

  trpcClient.events.track.mutate(batch).catch(() => {
    // Best-effort telemetry — a tracking failure must never surface to
    // the visitor or interrupt the flow it's observing.
  });
}

function ensureFlushListeners(): void {
  if (!isBrowser() || listenersAttached) return;
  listenersAttached = true;
  flushTimer ??= setInterval(() => flush("interval"), FLUSH_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush("beacon");
  });
  window.addEventListener("pagehide", () => flush("beacon"));
}

/**
 * Queues (or, for funnel-critical types, immediately sends) a tracking
 * event. Always fire-and-forget and exception-safe — safe to call
 * directly from cart-store.ts mutations, checkout steps, or render-path
 * effects without a try/catch at the call site.
 */
export function trackEvent(type: AnalyticsEventType, payload: TrackEventPayload = {}): void {
  if (!isBrowser()) return;
  ensureFlushListeners();

  const event: QueuedEvent = {
    type,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    createdAt: new Date().toISOString(),
    ...payload,
  };

  if (IMMEDIATE_TYPES.has(type)) {
    flush("immediate", [event]);
    return;
  }
  queue.push(event);
}

/** Convenience wrapper for the common PAGE_VIEW case. */
export function trackPageView(path: string): void {
  trackEvent("PAGE_VIEW", { path });
}

export interface CartSnapshotItem {
  productId: string;
  quantity: number;
  neverSubstitute: boolean;
}

// Debounced separately from the page-view/interaction queue above — a
// cart snapshot only needs the *latest* state, so intermediate quantity
// nudges within this window are collapsed into a single upsert rather
// than queued individually.
const CART_SYNC_DEBOUNCE_MS = 1500;
let cartSyncTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Cart Abandonment foundation — debounced upsert of this visitor's
 * current cart contents. Called from lib/cart-store.ts's subscribe
 * hook on every lines change; safe to call on every keystroke-adjacent
 * quantity nudge since it's debounced.
 */
export function syncCartSnapshot(items: CartSnapshotItem[]): void {
  if (!isBrowser()) return;
  if (cartSyncTimer) clearTimeout(cartSyncTimer);
  cartSyncTimer = setTimeout(() => {
    trpcClient.events.syncCart.mutate({ visitorId: getVisitorId(), items }).catch(() => {
      // Best-effort — a failed snapshot sync must never surface to the visitor.
    });
  }, CART_SYNC_DEBOUNCE_MS);
}

/**
 * Marks this visitor's cart snapshot as recovered. Fired once, immediately
 * (never debounced), from the checkout success path — see
 * server/analytics/cart-snapshot.ts's markCartRecovered for why this must
 * land before the empty-cart syncCartSnapshot that clearCart() triggers
 * moments later.
 */
export function recoverCartSnapshot(orderId: string): void {
  if (!isBrowser()) return;
  trpcClient.events.recoverCart.mutate({ visitorId: getVisitorId(), orderId }).catch(() => {
    // Best-effort — never surface to the visitor; the purchase itself
    // already succeeded regardless of this bookkeeping call.
  });
}

/**
 * Records "time spent in a section." Takes the section's mount timestamp
 * (from `Date.now()` when the caller's effect started) rather than
 * managing its own timer — the caller (a useEffect cleanup, a
 * visibilitychange handler) decides when a section is actually "left."
 * Sub-second dwells are dropped as accidental bounces, not meaningful
 * signal.
 */
export function trackSectionDwell(startedAt: number, payload: TrackEventPayload = {}): void {
  const durationMs = Date.now() - startedAt;
  if (durationMs < MIN_DWELL_MS) return;
  trackEvent("SECTION_DWELL", { ...payload, metadata: { ...payload.metadata, durationMs } });
}
