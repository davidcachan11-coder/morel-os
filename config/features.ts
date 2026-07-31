/**
 * Feature flags describing the capabilities currently implemented in the
 * app. Not wired into any component yet — this documents the current
 * feature set as a starting point for future toggling.
 */
export const features = {
  storefront: true,
  cartSubstitutionPreferences: true,
  expressDelivery: true,
  liveOrderTracking: true,
  opsDashboard: true,
} as const;
