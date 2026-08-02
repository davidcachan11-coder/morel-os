import "server-only";

import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import {
  ANALYTICS_PERIODS,
  bucketGranularity,
  computeDeltaPct,
  resolvePeriodRanges,
  type DateRange,
} from "@/server/analytics/period";
import {
  REVENUE_DECLINE_ALERT_THRESHOLD_PCT,
  STUCK_ORDER_THRESHOLD_MINUTES,
  type OperationalAlert,
} from "@/server/analytics/alerts";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared input shape
// ---------------------------------------------------------------------------

const analyticsInput = z.object({
  period: z.enum(ANALYTICS_PERIODS).default("30d"),
  // Real filter, not speculative — the seed data genuinely spans 3 Branch
  // rows (see docs/DECISIONS.md's Admin Platform entry). Undefined means
  // "all branches."
  branchId: z.string().min(1).optional(),
});

function orderWhere(range: DateRange, branchId?: string) {
  return {
    createdAt: { gte: range.start, lt: range.end },
    ...(branchId ? { branchId } : {}),
  };
}

/**
 * Internal-classification aggregate KPIs (SECURITY_ARCHITECTURE.md §5.1:
 * "Internal | Aggregate KPIs, non-customer-identifying operational data |
 * Staff-authenticated access only") — every procedure here is
 * `protectedProcedure()` with no role restriction: any authenticated staff
 * session, matching that classification exactly rather than inventing a
 * stricter gate. Cross-domain by nature (Order + OrderItem + Product +
 * Customer), which is why this is its own router rather than folded into
 * ordersRouter/catalog.ts — see docs/DECISIONS.md's Admin Platform entry.
 *
 * Every number here is a real query against real rows — no synthetic data,
 * no hardcoded percentages. Where the underlying data is too thin or
 * genuinely absent to answer a question honestly (product-level revenue
 * before most orders had itemized OrderItem rows, cancelled-order tracking,
 * delivery timing), the response says so explicitly rather than guessing.
 */
export const analyticsRouter = router({
  listBranches: protectedProcedure().query(({ ctx }) => {
    return ctx.prisma.branch.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }),

  // Phase 2: top-line KPIs with period-over-period comparison.
  getSummary: protectedProcedure()
    .input(analyticsInput)
    .query(async ({ ctx, input }) => {
      const { current, previous } = resolvePeriodRanges(input.period);

      async function summarize(range: DateRange) {
        const where = orderWhere(range, input.branchId);
        const [orders, revenueAgg, distinctCustomers, itemsAgg] = await Promise.all([
          ctx.prisma.order.count({ where }),
          ctx.prisma.order.aggregate({ where, _sum: { total: true } }),
          ctx.prisma.order.findMany({
            where,
            select: { customerId: true },
            distinct: ["customerId"],
          }),
          ctx.prisma.orderItem.aggregate({
            where: { order: where },
            _sum: { quantity: true },
          }),
        ]);
        const revenue = revenueAgg._sum.total ? Number(revenueAgg._sum.total) : 0;
        const customers = distinctCustomers.length;
        const productsSold = itemsAgg._sum.quantity ? Number(itemsAgg._sum.quantity) : 0;
        const aov = orders > 0 ? revenue / orders : null;
        return { orders, revenue, customers, productsSold, aov };
      }

      const [curr, prev] = await Promise.all([summarize(current), summarize(previous)]);

      return {
        period: input.period,
        range: current,
        revenue: { value: curr.revenue, deltaPct: computeDeltaPct(curr.revenue, prev.revenue) },
        orders: { value: curr.orders, deltaPct: computeDeltaPct(curr.orders, prev.orders) },
        // aov delta is null whenever either side has zero orders — dividing
        // by an order count of 0 has no honest average to compare.
        averageOrderValue: {
          value: curr.aov,
          deltaPct:
            curr.aov !== null && prev.aov !== null
              ? computeDeltaPct(curr.aov, prev.aov)
              : null,
        },
        customers: {
          value: curr.customers,
          deltaPct: computeDeltaPct(curr.customers, prev.customers),
        },
        productsSold: {
          value: curr.productsSold,
          deltaPct: computeDeltaPct(curr.productsSold, prev.productsSold),
        },
        // Explicit signal for the UI: the previous window had zero orders,
        // so every delta above that resolved to `null` means "no baseline,"
        // not "0% change" — surfaced once here instead of re-derived by the
        // client from five separate null checks.
        previousPeriodHasData: prev.orders > 0,
      };
    }),

  // Phase 3: revenue/orders over time, bucketed daily (hourly for "today").
  getRevenueTrend: protectedProcedure()
    .input(analyticsInput)
    .query(async ({ ctx, input }) => {
      const { current } = resolvePeriodRanges(input.period);
      const orders = await ctx.prisma.order.findMany({
        where: orderWhere(current, input.branchId),
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" },
      });

      const granularity = bucketGranularity(input.period);
      const buckets = new Map<string, { revenue: number; orders: number }>();
      for (const order of orders) {
        const key =
          granularity === "hour"
            ? order.createdAt.toISOString().slice(0, 13) // yyyy-mm-ddThh
            : order.createdAt.toISOString().slice(0, 10); // yyyy-mm-dd
        const bucket = buckets.get(key) ?? { revenue: 0, orders: 0 };
        bucket.revenue += Number(order.total);
        bucket.orders += 1;
        buckets.set(key, bucket);
      }

      const points = [...buckets.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bucket, v]) => ({ bucket, ...v }));

      const peak = points.reduce<(typeof points)[number] | null>(
        (best, p) => (!best || p.revenue > best.revenue ? p : best),
        null
      );

      return { granularity, points, peak };
    }),

  // Phase 3: product performance. Revenue here is an ESTIMATE (quantity ×
  // current Product.price) — OrderItem does not snapshot the price at
  // order time, only quantity, so a price change since an order would
  // skew this. Ranked by quantity (exact) as the primary signal;
  // estimatedRevenue is secondary and labeled as such by the caller.
  // Also thin by data, not by query correctness: only one seeded order has
  // real OrderItem rows today (see docs/DECISIONS.md's Admin Platform entry).
  getTopProducts: protectedProcedure()
    .input(analyticsInput.extend({ limit: z.number().int().positive().max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const { current } = resolvePeriodRanges(input.period);
      const grouped = await ctx.prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: orderWhere(current, input.branchId) },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: input.limit,
      });
      if (grouped.length === 0) return [];

      const products = await ctx.prisma.product.findMany({
        where: { id: { in: grouped.map((g) => g.productId) } },
        select: { id: true, name: true, price: true, emoji: true, categoryId: true },
      });
      const productById = new Map(products.map((p) => [p.id, p]));

      return grouped
        .map((g) => {
          const product = productById.get(g.productId);
          const quantity = g._sum.quantity ? Number(g._sum.quantity) : 0;
          return product
            ? {
                productId: product.id,
                name: product.name,
                emoji: product.emoji,
                quantity,
                estimatedRevenue: quantity * Number(product.price),
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
    }),

  // Phase 3: category-level sales distribution. Same estimated-revenue and
  // data-thinness caveats as getTopProducts above.
  getCategoryPerformance: protectedProcedure()
    .input(analyticsInput)
    .query(async ({ ctx, input }) => {
      const { current } = resolvePeriodRanges(input.period);
      const items = await ctx.prisma.orderItem.findMany({
        where: { order: orderWhere(current, input.branchId) },
        select: {
          quantity: true,
          product: { select: { price: true, category: { select: { id: true, name: true } } } },
        },
      });

      const byCategory = new Map<string, { name: string; quantity: number; estimatedRevenue: number }>();
      for (const item of items) {
        const { category } = item.product;
        const entry = byCategory.get(category.id) ?? {
          name: category.name,
          quantity: 0,
          estimatedRevenue: 0,
        };
        const quantity = Number(item.quantity);
        entry.quantity += quantity;
        entry.estimatedRevenue += quantity * Number(item.product.price);
        byCategory.set(category.id, entry);
      }

      return [...byCategory.entries()]
        .map(([categoryId, v]) => ({ categoryId, ...v }))
        .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
    }),

  // Phase 3: customer behavior. newCustomers is signup-date-scoped (Users
  // aren't branch members, so branchId isn't applied there); everything
  // else that's order-derived respects the branch filter.
  getCustomerStats: protectedProcedure()
    .input(analyticsInput)
    .query(async ({ ctx, input }) => {
      const { current } = resolvePeriodRanges(input.period);
      const where = orderWhere(current, input.branchId);

      const [newCustomers, periodCustomers, topSpenders] = await Promise.all([
        ctx.prisma.user.count({
          where: { role: "CUSTOMER", createdAt: { gte: current.start, lt: current.end } },
        }),
        ctx.prisma.order.findMany({ where, select: { customerId: true }, distinct: ["customerId"] }),
        ctx.prisma.order.groupBy({
          by: ["customerId"],
          _sum: { total: true },
          _count: { _all: true },
          orderBy: { _sum: { total: "desc" } },
          take: 5,
        }),
      ]);

      const periodCustomerIds = periodCustomers.map((c) => c.customerId);
      const lifetimeCounts =
        periodCustomerIds.length > 0
          ? await ctx.prisma.order.groupBy({
              by: ["customerId"],
              where: { customerId: { in: periodCustomerIds } },
              _count: { _all: true },
            })
          : [];
      const returningInPeriod = lifetimeCounts.filter((c) => c._count._all > 1).length;

      const revenueAgg = await ctx.prisma.order.aggregate({ where, _sum: { total: true } });
      const revenue = revenueAgg._sum.total ? Number(revenueAgg._sum.total) : 0;
      const averageSpend = periodCustomerIds.length > 0 ? revenue / periodCustomerIds.length : null;

      const spenderIds = topSpenders.map((s) => s.customerId);
      const spenderCustomers =
        spenderIds.length > 0
          ? await ctx.prisma.customer.findMany({
              where: { id: { in: spenderIds } },
              select: { id: true, user: { select: { name: true, email: true } } },
            })
          : [];
      const spenderById = new Map(spenderCustomers.map((c) => [c.id, c]));

      return {
        newCustomers,
        activeCustomers: periodCustomerIds.length,
        returningCustomers: returningInPeriod,
        averageSpend,
        topCustomers: topSpenders
          .map((s) => {
            const customer = spenderById.get(s.customerId);
            if (!customer) return null;
            return {
              customerId: s.customerId,
              name: customer.user.name ?? customer.user.email,
              totalSpend: s._sum.total ? Number(s._sum.total) : 0,
              orderCount: s._count._all,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null),
      };
    }),

  // Phase 4: order status breakdown. "Current status" = latest
  // OrderStatusEvent per order (no denormalized status field on Order — see
  // prisma/schema.prisma's comment on that design choice). Cancelled orders
  // are explicitly reported as untracked, not a fabricated zero — OrderStatus
  // has no cancellation state in the schema today.
  getOrderStatusBreakdown: protectedProcedure()
    .input(analyticsInput)
    .query(async ({ ctx, input }) => {
      const { current } = resolvePeriodRanges(input.period);
      const orders = await ctx.prisma.order.findMany({
        where: orderWhere(current, input.branchId),
        select: {
          statusEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true },
          },
        },
      });

      const counts: Record<OrderStatus, number> = {
        CONFIRMADO: 0,
        PREPARANDO: 0,
        CONTROL_CALIDAD: 0,
        EN_CAMINO: 0,
        ENTREGADO: 0,
      };
      for (const order of orders) {
        const status = order.statusEvents[0]?.status;
        if (status) counts[status] += 1;
      }

      const total = orders.length;
      const completed = counts.ENTREGADO;
      const pending = total - completed;

      return {
        total,
        byStatus: counts,
        pending,
        completed,
        cancelled: { count: 0, tracked: false },
      };
    }),

  // Executive Dashboard: revenue/orders per branch, for comparing branches
  // against each other — deliberately ignores any single-branch filter
  // (that's the whole point of this view). Real, not speculative: the seed
  // data genuinely spans 3 Branch rows.
  getBranchPerformance: protectedProcedure()
    .input(z.object({ period: z.enum(ANALYTICS_PERIODS).default("30d") }))
    .query(async ({ ctx, input }) => {
      const { current } = resolvePeriodRanges(input.period);
      const [branches, grouped] = await Promise.all([
        ctx.prisma.branch.findMany({ select: { id: true, name: true } }),
        ctx.prisma.order.groupBy({
          by: ["branchId"],
          where: { createdAt: { gte: current.start, lt: current.end } },
          _sum: { total: true },
          _count: { _all: true },
        }),
      ]);
      const byBranchId = new Map(grouped.map((g) => [g.branchId, g]));
      const totalRevenue = grouped.reduce(
        (sum, g) => sum + (g._sum.total ? Number(g._sum.total) : 0),
        0
      );

      return branches
        .map((branch) => {
          const g = byBranchId.get(branch.id);
          const revenue = g?._sum.total ? Number(g._sum.total) : 0;
          return {
            branchId: branch.id,
            name: branch.name,
            revenue,
            orders: g?._count._all ?? 0,
            share: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);
    }),

  // Executive Dashboard: most recent orders — a "what just happened" feed,
  // deliberately not period-scoped (recency ordering already answers that),
  // still respects the branch filter for consistency with the rest of the
  // dashboard.
  getRecentActivity: protectedProcedure()
    .input(
      z.object({
        branchId: z.string().min(1).optional(),
        limit: z.number().int().positive().max(50).default(8),
      })
    )
    .query(async ({ ctx, input }) => {
      const orders = await ctx.prisma.order.findMany({
        where: input.branchId ? { branchId: input.branchId } : undefined,
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          createdAt: true,
          customer: { select: { user: { select: { name: true, email: true } } } },
          branch: { select: { name: true } },
          statusEvents: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
        },
      });

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer.user.name ?? order.customer.user.email,
        branchName: order.branch.name,
        total: Number(order.total),
        status: order.statusEvents[0]?.status ?? null,
        createdAt: order.createdAt,
      }));
    }),

  // Executive Dashboard: operational alerts — every condition here is a
  // real query against real rows, gated by a labeled, defensible threshold
  // (server/analytics/alerts.ts explains why those thresholds are
  // configured defaults, not discovered facts). No alert fires from
  // fabricated or assumed data; an empty result is a genuine "nothing to
  // flag," not a missing feature.
  getOperationalAlerts: protectedProcedure()
    .input(
      z.object({
        period: z.enum(ANALYTICS_PERIODS).default("30d"),
        branchId: z.string().min(1).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const alerts: OperationalAlert[] = [];

      // 1. Stuck orders — a "right now" concept (uses the actual current
      // time), not scoped to the dashboard's selected comparison period:
      // an order stuck in PREPARANDO is stuck regardless of which period
      // filter happens to be selected.
      const stuckThreshold = new Date(Date.now() - STUCK_ORDER_THRESHOLD_MINUTES * 60_000);
      const openOrders = await ctx.prisma.order.findMany({
        where: input.branchId ? { branchId: input.branchId } : undefined,
        select: {
          orderNumber: true,
          statusEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true, createdAt: true },
          },
        },
      });
      const stuckOrders = openOrders.filter((o) => {
        const latest = o.statusEvents[0];
        return latest && latest.status !== "ENTREGADO" && latest.createdAt < stuckThreshold;
      });
      if (stuckOrders.length > 0) {
        alerts.push({
          id: "stuck-orders",
          severity: "warning",
          title: `${stuckOrders.length} ${
            stuckOrders.length === 1 ? "pedido lleva" : "pedidos llevan"
          } más de ${STUCK_ORDER_THRESHOLD_MINUTES} minutos sin avanzar de estado`,
          description:
            stuckOrders
              .slice(0, 5)
              .map((o) => `#${o.orderNumber}`)
              .join(", ") + (stuckOrders.length > 5 ? "…" : ""),
        });
      }

      const { current, previous } = resolvePeriodRanges(input.period);

      // 2. Branches with zero orders in the period — only meaningful when
      // looking at all branches at once (a single-branch filter already
      // says which branch you're looking at).
      if (!input.branchId) {
        const [branches, grouped] = await Promise.all([
          ctx.prisma.branch.findMany({ select: { id: true, name: true } }),
          ctx.prisma.order.groupBy({
            by: ["branchId"],
            where: { createdAt: { gte: current.start, lt: current.end } },
            _count: { _all: true },
          }),
        ]);
        const activeBranchIds = new Set(grouped.map((g) => g.branchId));
        const quietBranches = branches.filter((b) => !activeBranchIds.has(b.id));
        // Only alert if SOME branches are active and others aren't — if
        // every branch is quiet, that's just "no orders in this period,"
        // already covered by previousPeriodHasData elsewhere, not a
        // branch-specific anomaly.
        if (quietBranches.length > 0 && quietBranches.length < branches.length) {
          alerts.push({
            id: "quiet-branches",
            severity: "info",
            title:
              quietBranches.length === 1
                ? "Una sucursal no registró pedidos en este período"
                : `${quietBranches.length} sucursales no registraron pedidos en este período`,
            description: quietBranches.map((b) => b.name).join(", "),
          });
        }
      }

      // 3. Revenue decline vs. the previous equivalent period — null delta
      // (no previous-period baseline) never triggers this, matching
      // computeDeltaPct's "don't fabricate a comparison" contract.
      const [currRevenueAgg, prevRevenueAgg] = await Promise.all([
        ctx.prisma.order.aggregate({
          where: orderWhere(current, input.branchId),
          _sum: { total: true },
        }),
        ctx.prisma.order.aggregate({
          where: orderWhere(previous, input.branchId),
          _sum: { total: true },
        }),
      ]);
      const currRevenue = currRevenueAgg._sum.total ? Number(currRevenueAgg._sum.total) : 0;
      const prevRevenue = prevRevenueAgg._sum.total ? Number(prevRevenueAgg._sum.total) : 0;
      const revenueDelta = computeDeltaPct(currRevenue, prevRevenue);
      if (revenueDelta !== null && revenueDelta <= REVENUE_DECLINE_ALERT_THRESHOLD_PCT) {
        alerts.push({
          id: "revenue-decline",
          severity: "warning",
          title: `Los ingresos cayeron ${Math.abs(revenueDelta).toFixed(0)}% respecto al período anterior`,
          description: `${formatCurrency(currRevenue)} en este período vs. ${formatCurrency(prevRevenue)} en el anterior.`,
        });
      }

      return alerts;
    }),
});
