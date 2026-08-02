// Client-safe display constants for CustomerSegment, deliberately
// duplicated from (not imported from) server/analytics/segments.ts, which
// is "server-only" — same pattern as order-status-ui.ts's relationship to
// server/orders/status.ts.
export type CustomerSegment = "vip" | "frequent" | "returning" | "new" | "inactive" | "sin_pedidos";

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  vip: "VIP",
  frequent: "Frecuente",
  returning: "Recurrente",
  new: "Nuevo",
  inactive: "Inactivo",
  sin_pedidos: "Sin pedidos",
};

export const SEGMENT_BADGE_CLASS: Record<CustomerSegment, string> = {
  vip: "bg-brand-orange/15 text-brand-orange-dark",
  frequent: "bg-brand-green/15 text-brand-green-dark",
  returning: "bg-brand-indigo/10 text-brand-indigo",
  new: "bg-brand-navy/10 text-brand-navy",
  inactive: "bg-secondary text-secondary-foreground",
  sin_pedidos: "bg-muted text-muted-foreground",
};
