import { Inbox, TrendingUp } from "lucide-react";
import { RevenueTrendChart } from "@/components/admin/revenue-trend-chart";
import { TopProductsList } from "@/components/admin/top-products-list";
import { CategoryPerformanceList } from "@/components/admin/category-performance-list";
import { CustomerStatsPanel } from "@/components/admin/customer-stats-panel";
import { FunnelStages } from "@/components/admin/funnel-stages";
import { AbandonmentSummary } from "@/components/admin/abandonment-summary";
import { AbandonedCartsList } from "@/components/admin/abandoned-carts-list";
import { BranchComparisonTable } from "@/components/admin/branch-comparison-table";
import { SalesSummaryStrip, type SalesSummaryStat } from "@/components/admin/sales-summary-strip";
import { SortToggle } from "@/components/admin/sort-toggle";
import { PeriodSelector } from "@/components/admin/period-selector";
import { BranchSelector } from "@/components/admin/branch-selector";
import { createServerCaller } from "@/server/trpc/caller";
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from "@/server/analytics/period";
import { formatCurrency } from "@/lib/utils";

function parsePeriod(value: string | undefined): AnalyticsPeriod {
  return value && (ANALYTICS_PERIODS as readonly string[]).includes(value)
    ? (value as AnalyticsPeriod)
    : "30d";
}

type ProductSort = "quantity" | "revenue";

function parseProductSort(value: string | undefined): ProductSort {
  return value === "revenue" ? "revenue" : "quantity";
}

function formatPeakLabel(bucket: string, granularity: "hour" | "day"): string {
  if (granularity === "hour") return `${bucket.slice(11, 13)}:00`;
  const [, month, day] = bucket.split("-");
  return `${day}/${month}`;
}

export default async function AnaliticaPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; branch?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const branchId = params.branch || undefined;
  const productSort = parseProductSort(params.sort);

  const trpc = await createServerCaller();
  const [
    summary,
    revenueTrend,
    topProducts,
    categoryPerformance,
    customerStats,
    branchComparison,
    branches,
    funnel,
    abandonedCarts,
  ] = await Promise.all([
    trpc.analytics.getSummary({ period, branchId }),
    trpc.analytics.getRevenueTrend({ period, branchId }),
    trpc.analytics.getTopProducts({ period, branchId, limit: 8, sortBy: productSort }),
    trpc.analytics.getCategoryPerformance({ period, branchId }),
    trpc.analytics.getCustomerStats({ period, branchId }),
    trpc.analytics.getBranchPerformance({ period }),
    trpc.analytics.listBranches(),
    // Ecommerce Funnel Analytics / Cart Abandonment foundation —
    // deliberately not branch-scoped: visitor-level browsing events aren't
    // attributed to a branch anywhere in the schema (only Order is).
    trpc.events.getFunnel({ period }),
    trpc.events.getAbandonedCarts({ limit: 10 }),
  ]);

  const hasItemizedSales = topProducts.length > 0 || categoryPerformance.length > 0;

  const salesStats: SalesSummaryStat[] = [
    {
      label: "Ingresos totales",
      value: formatCurrency(summary.revenue.value),
      deltaPct: summary.revenue.deltaPct,
    },
    {
      label: "Pedidos",
      value: String(summary.orders.value),
      deltaPct: summary.orders.deltaPct,
    },
    {
      label: "Ticket promedio",
      value:
        summary.averageOrderValue.value !== null
          ? formatCurrency(summary.averageOrderValue.value)
          : "—",
      deltaPct: summary.averageOrderValue.deltaPct,
    },
  ];

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Analítica de ventas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tendencias de ingresos, desempeño de productos y comportamiento de clientes.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <BranchSelector branches={branches} />
            <PeriodSelector
              currentPeriod={period}
              currentBranchId={branchId}
              basePath="/admin/analitica"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Análisis de ventas
          </h2>
          {summary.orders.value === 0 ? (
            // Same reasoning as the Dashboard's KPI-row empty state: when
            // both the current AND previous period have zero orders,
            // computeDeltaPct's both-zero case is a real "0%" — correct
            // math, but "$0 · 0% vs. período anterior" reads as broken,
            // not as "no activity yet." Say it once instead.
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Esperando actividad</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                No se registraron pedidos en este período. El análisis va a aparecer apenas haya
                actividad.
              </p>
            </div>
          ) : (
            <SalesSummaryStrip stats={salesStats} />
          )}

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Ingresos y pedidos</h3>
              {revenueTrend.peak && (
                <span className="flex items-center gap-1.5 rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green-dark">
                  <TrendingUp className="h-3 w-3" />
                  Pico: {formatPeakLabel(revenueTrend.peak.bucket, revenueTrend.granularity)} —{" "}
                  {formatCurrency(revenueTrend.peak.revenue)}
                </span>
              )}
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Barras: ingresos · Línea: cantidad de pedidos
            </p>
            {revenueTrend.points.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Sin datos para este período.
              </p>
            ) : (
              <RevenueTrendChart points={revenueTrend.points} granularity={revenueTrend.granularity} />
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Desempeño de productos</h2>
              <SortToggle
                options={[
                  { value: "quantity", label: "Por unidades" },
                  { value: "revenue", label: "Por ingresos" },
                ]}
                current={productSort}
                paramName="sort"
                basePath="/admin/analitica"
                extraParams={{ period, branch: branchId }}
              />
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Unidades vendidas exactas · ingresos estimados al precio actual
            </p>
            <TopProductsList products={topProducts} />
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-1 text-sm font-semibold text-foreground">
              Desempeño por categoría
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Distribución de ventas · ingresos estimados al precio actual
            </p>
            <CategoryPerformanceList categories={categoryPerformance} />
          </div>
        </section>

        {!hasItemizedSales && (
          <p className="text-xs text-muted-foreground">
            Los productos y categorías todavía tienen poco detalle de venta: la mayoría de los
            pedidos de datos de referencia no tienen productos individuales cargados. Estas
            secciones se completan automáticamente a medida que entran pedidos reales con detalle
            de carrito.
          </p>
        )}

        <section className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div>
            <h2 className="mb-1 text-sm font-semibold text-foreground">
              Embudo de conversión y abandono
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Visitante → vio un producto → agregó al carrito → inició el pago → compró. Conteos
              de visitantes distintos, no un embudo estrictamente secuencial — ver nota en
              eventsRouter.getFunnel.
            </p>
            <FunnelStages stages={funnel.stages} />
          </div>

          <AbandonmentSummary
            stats={[
              {
                label: "Abandono de carrito",
                abandonedCount: funnel.cartAbandonment.abandonedCount,
                ratePct: funnel.cartAbandonment.ratePct,
              },
              {
                label: "Abandono de checkout",
                abandonedCount: funnel.checkoutAbandonment.abandonedCount,
                ratePct: funnel.checkoutAbandonment.ratePct,
              },
            ]}
          />

          <div>
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground">
              Carritos abandonados ahora mismo
            </h3>
            <AbandonedCartsList carts={abandonedCarts} />
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Comparación por sucursal</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Todo el período, sin filtro de sucursal — para comparar sucursales entre sí
          </p>
          <BranchComparisonTable branches={branchComparison} />
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Comportamiento de clientes</h2>
          <CustomerStatsPanel stats={customerStats} />
        </section>
      </div>
    </div>
  );
}
