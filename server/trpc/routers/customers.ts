import "server-only";

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import {
  computeCustomerSegment,
  FREQUENT_BUYER_WINDOW_DAYS,
} from "@/server/analytics/segments";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(date: Date | null): number | null {
  return date ? Math.floor((Date.now() - date.getTime()) / DAY_MS) : null;
}

/**
 * Customer Intelligence & Growth Analytics — the per-customer list/detail
 * view that /admin/clientes's placeholder has pointed to since the Admin
 * Platform entry (its own dataNote: "aggregate metrics ... are in
 * Analítica; this section is the individual customer view, not yet
 * built"). Internal-classification, any authenticated staff — same
 * protectedProcedure() pattern as analyticsRouter, since this is
 * genuinely the same "Internal | Aggregate ... | Staff-authenticated
 * access only" classification, just scoped to one customer at a time
 * rather than aggregated.
 *
 * Its own router file, not folded into analyticsRouter: this is squarely
 * the Customer domain's own read model (list + detail of Customer rows),
 * not a cross-domain reporting query the way analyticsRouter's procedures
 * are — matching root.ts's stated rule that a domain gets a router file
 * the moment it has its first real procedure.
 */
export const customersRouter = router({
  list: protectedProcedure()
    .input(
      z.object({
        search: z.string().trim().min(1).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.CustomerWhereInput = input.search
        ? {
            user: {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
              ],
            },
          }
        : {};

      // Segment/lifetime-spend are computed, not columns, so they can't be
      // pushed into a WHERE/ORDER BY at the database level — bounded
      // candidate fetch, then in-memory sort/pagination. Same pattern (and
      // same "fine at today's volume" caveat) as ordersRouter.staff.list.
      const CANDIDATE_CAP = 500;
      const customers = await ctx.prisma.customer.findMany({
        where,
        take: CANDIDATE_CAP,
        select: {
          id: true,
          user: { select: { name: true, email: true } },
          orders: { select: { total: true, createdAt: true } },
        },
      });

      const windowStart = new Date(Date.now() - FREQUENT_BUYER_WINDOW_DAYS * DAY_MS);

      const withSegment = customers.map((c) => {
        const orderCount = c.orders.length;
        const lifetimeSpend = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
        const ordersInWindow = c.orders.filter((o) => o.createdAt >= windowStart).length;
        const lastOrderAt = c.orders.reduce<Date | null>(
          (latest, o) => (!latest || o.createdAt > latest ? o.createdAt : latest),
          null
        );
        return {
          customerId: c.id,
          name: c.user.name ?? c.user.email,
          email: c.user.email,
          orderCount,
          lifetimeSpend,
          lastOrderAt,
          segment: computeCustomerSegment({
            orderCount,
            lifetimeSpend,
            ordersInWindow,
            daysSinceLastOrder: daysSince(lastOrderAt),
          }),
        };
      });

      // Most-recently-active first — matches the module's stated purpose
      // ("who's ordering, how often") better than an arbitrary id order.
      // Customers with no orders (lastOrderAt: null) sort last.
      withSegment.sort((a, b) => (b.lastOrderAt?.getTime() ?? 0) - (a.lastOrderAt?.getTime() ?? 0));

      const total = withSegment.length;
      const start = (input.page - 1) * input.pageSize;
      const page = withSegment.slice(start, start + input.pageSize);

      return { customers: page, total, page: input.page, pageSize: input.pageSize };
    }),

  getDetail: protectedProcedure()
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.prisma.customer.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          user: { select: { name: true, email: true, phone: true, createdAt: true } },
          addresses: {
            select: {
              street: true,
              sector: true,
              municipality: true,
              province: true,
              isDefault: true,
            },
          },
          orders: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
              branch: { select: { name: true } },
              items: { select: { neverSubstitute: true } },
              statusEvents: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
            },
          },
        },
      });
      if (!customer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado." });
      }

      const orderCount = customer.orders.length;
      const lifetimeSpend = customer.orders.reduce((sum, o) => sum + Number(o.total), 0);
      const windowStart = new Date(Date.now() - FREQUENT_BUYER_WINDOW_DAYS * DAY_MS);
      const ordersInWindow = customer.orders.filter((o) => o.createdAt >= windowStart).length;
      const lastOrderAt = customer.orders[0]?.createdAt ?? null;

      // Substitution preference pattern (docs/DASHBOARD_SPEC.md's
      // Customers module: "substitution preference patterns per
      // customer") — a real percentage derived from this customer's own
      // OrderItem.neverSubstitute history, not a guess. A single
      // aggregate figure, not a per-product breakdown — proportionate to
      // what's asked for here (foundation, not the full Customers module).
      const totalItems = customer.orders.reduce((sum, o) => sum + o.items.length, 0);
      const neverSubstituteItems = customer.orders.reduce(
        (sum, o) => sum + o.items.filter((i) => i.neverSubstitute).length,
        0
      );

      return {
        id: customer.id,
        name: customer.user.name ?? customer.user.email,
        email: customer.user.email,
        phone: customer.user.phone,
        memberSince: customer.user.createdAt,
        addresses: customer.addresses,
        segment: computeCustomerSegment({
          orderCount,
          lifetimeSpend,
          ordersInWindow,
          daysSinceLastOrder: daysSince(lastOrderAt),
        }),
        orderCount,
        lifetimeSpend,
        averageOrderValue: orderCount > 0 ? lifetimeSpend / orderCount : null,
        lastOrderAt,
        neverSubstitutePct: totalItems > 0 ? (neverSubstituteItems / totalItems) * 100 : null,
        orders: customer.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: Number(o.total),
          createdAt: o.createdAt,
          branchName: o.branch.name,
          status: o.statusEvents[0]?.status ?? null,
        })),
      };
    }),
});
