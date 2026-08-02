import "server-only";

import type { OrderStatus, Role } from "@prisma/client";
import { ORDER_STATUS_SEQUENCE } from "@/components/admin/order-status-ui";
import { ORDERS_STAFF_ROLES } from "@/lib/orders-rbac";

// Re-exported so server/trpc/routers/orders.ts has one import path for
// everything Orders-RBAC/transition-related, even though the roles list
// itself lives in lib/orders-rbac.ts (client-safe, also consumed by
// components/admin/shell/nav-config.ts to hide the Pedidos nav item from
// roles that would just get redirected away from it).
export { ORDERS_STAFF_ROLES };

/**
 * Whether `role` may move an order from `current` to `next`.
 *
 * Non-admin roles: forward only — `next` must come later in
 * ORDER_STATUS_SEQUENCE than `current`. Jumping ahead (e.g. skipping
 * CONTROL_CALIDAD) is allowed — some fulfillment paths genuinely skip a
 * step — but going backward or re-setting the same status is not; that
 * would let routine staff action silently rewrite history a customer may
 * already be watching on the public tracker.
 *
 * Admin: any status different from the current one, including backward —
 * the deliberate escape hatch for correcting a mistaken update, per
 * SECURITY_ARCHITECTURE.md §2's least-privilege-with-an-admin-override
 * pattern used elsewhere in this app (e.g. mustChangePassword resets).
 */
export function isValidStatusTransition(
  current: OrderStatus,
  next: OrderStatus,
  role: Role
): boolean {
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(current);
  const nextIndex = ORDER_STATUS_SEQUENCE.indexOf(next);
  if (role === "ADMIN") return nextIndex !== currentIndex;
  return nextIndex > currentIndex;
}
