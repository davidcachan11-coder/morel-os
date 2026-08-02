import type { Role } from "@prisma/client";

/**
 * Staff roles allowed to view/operate the Orders module
 * (BACKEND_ARCHITECTURE.md §7's role table: Operations access is
 * branch_staff/branch_manager/ops_manager/admin only). Client-safe (no
 * "server-only") so it can drive nav-item visibility
 * (components/admin/shell/nav-config.ts) as well as the server-side RBAC
 * gate (server/orders/status.ts re-exports this for
 * protectedProcedure(...ORDERS_STAFF_ROLES)) — one definition, two
 * consumers, never two lists to keep in sync by hand.
 */
export const ORDERS_STAFF_ROLES: Role[] = [
  "BRANCH_STAFF",
  "BRANCH_MANAGER",
  "OPS_MANAGER",
  "ADMIN",
];
