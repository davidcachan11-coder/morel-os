/**
 * localStorage key namespace used across the app's persisted client state.
 */
export const STORAGE_KEYS = {
  cart: "morel-os:cart",
  orders: "morel-os:orders",
  checkout: "morel-os:checkout",
  analyticsVisitor: "morel-os:analytics-visitor",
  analyticsSession: "morel-os:analytics-session",
} as const;
