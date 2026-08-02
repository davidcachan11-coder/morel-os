import type { OrderStatus } from "@prisma/client";

// Shared display constants for OrderStatus across admin components
// (order-status-breakdown, recent-activity-list, the Orders module) —
// extracted once a third call site needed the same labels, to stop
// re-declaring an identical map each time. Client-safe (no "server-only"),
// deliberately separate from server/orders/status.ts's
// ORDER_STATUS_SEQUENCE/transition-rule logic, which is server-only.
export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  "CONFIRMADO",
  "PREPARANDO",
  "CONTROL_CALIDAD",
  "EN_CAMINO",
  "ENTREGADO",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CONFIRMADO: "Confirmado",
  PREPARANDO: "Preparando",
  CONTROL_CALIDAD: "Control de calidad",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
};

export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  CONFIRMADO: "bg-brand-navy/10 text-brand-navy",
  PREPARANDO: "bg-brand-orange/10 text-brand-orange-dark",
  CONTROL_CALIDAD: "bg-brand-indigo/10 text-brand-indigo",
  EN_CAMINO: "bg-brand-green/15 text-brand-green-dark",
  ENTREGADO: "bg-secondary text-secondary-foreground",
};
