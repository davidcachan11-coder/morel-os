import "server-only";

/**
 * Customer segmentation thresholds. Same reasoning as
 * server/analytics/alerts.ts's thresholds: these are configured defaults,
 * not facts discovered from the business — nothing in docs/ specifies a
 * VIP spend cutoff or an inactivity window. Picking a labeled, defensible
 * default and saying so explicitly is the honest move; the alternative
 * (not segmenting at all) loses real value. Should become
 * admin-configurable once a real settings surface exists
 * (app/admin/(app)/configuracion is still a placeholder).
 *
 * Deliberately NOT RFM scoring or cohort-retention curves — see
 * docs/DECISIONS.md's Analytics-depth entry: "Advanced customer
 * segmentation ... needs either a larger, more temporally spread-out real
 * order history than exists today, or a dedicated CustomerSegment/
 * cohort-tracking model." Fixed, labeled thresholds over real Order data
 * are what today's data volume actually supports.
 */
export const VIP_LIFETIME_SPEND_THRESHOLD = 50_000; // ARS-equivalent currency units (constants/pricing.ts)
export const FREQUENT_BUYER_MIN_ORDERS = 3;
export const FREQUENT_BUYER_WINDOW_DAYS = 90;
export const INACTIVE_DAYS_THRESHOLD = 60;

export type CustomerSegment = "vip" | "frequent" | "returning" | "new" | "inactive" | "sin_pedidos";

export interface SegmentInput {
  orderCount: number;
  lifetimeSpend: number;
  /** Orders placed within the last FREQUENT_BUYER_WINDOW_DAYS. */
  ordersInWindow: number;
  /** null when orderCount === 0 — there is no "last order" to measure from. */
  daysSinceLastOrder: number | null;
}

/**
 * Priority order matters: VIP (spend) and Inactive (recency) are checked
 * before Frequent/Returning/New (order-count-shaped) — a high lifetime
 * spender who hasn't ordered recently is reported as VIP or Inactive, not
 * silently folded into "returning."
 */
export function computeCustomerSegment(input: SegmentInput): CustomerSegment {
  if (input.orderCount === 0) return "sin_pedidos";
  if (input.lifetimeSpend >= VIP_LIFETIME_SPEND_THRESHOLD) return "vip";
  if (input.daysSinceLastOrder !== null && input.daysSinceLastOrder >= INACTIVE_DAYS_THRESHOLD) {
    return "inactive";
  }
  if (input.ordersInWindow >= FREQUENT_BUYER_MIN_ORDERS) return "frequent";
  if (input.orderCount >= 2) return "returning";
  return "new";
}

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  vip: "VIP",
  frequent: "Frecuente",
  returning: "Recurrente",
  new: "Nuevo",
  inactive: "Inactivo",
  sin_pedidos: "Sin pedidos",
};
