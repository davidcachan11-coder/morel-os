import { TrendingUp } from "lucide-react";
import { RevenueTrendChart } from "@/components/admin/revenue-trend-chart";
import { TopProductsList } from "@/components/admin/top-products-list";
import { CategoryPerformanceList } from "@/components/admin/category-performance-list";
import { CustomerStatsPanel } from "@/components/admin/customer-stats-panel";
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

function formatPeakLabel(bucket: string, granularity: "hour" | "day"): string {
  if (granularity === "hour") return `${bucket.slice(11, 13)}:00`;
  const [, month, day] = bucket.split("-");
  return `${day}/${month}`;
}

export default async function AnaliticaPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; branch?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const branchId = params.branch || undefined;

  const trpc = await createServerCaller();
  const [revenueTrend, topProducts, categoryPerformance, customerStats, branches] =
    await Promise.all([
      trpc.analytics.getRevenueTrend({ period, branchId }),
      trpc.analytics.getTopProducts({ period, branchId, limit: 8 }),
      trpc.analytics.getCategoryPerformance({ period, branchId }),
      trpc.analytics.getCustomerStats({ period, branchId }),
      trpc.analytics.listBranches(),
    ]);

  const hasItemizedSales = topProducts.length > 0 || categoryPerformance.length > 0;

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
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Ingresos y pedidos</h2>
            {revenueTrend.peak && (
              <span className="flex items-center gap-1.5 rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green-dark">
                <TrendingUp className="h-3 w-3" />
                Pico:{" "}
                {formatPeakLabel(revenueTrend.peak.bucket, revenueTrend.granularity)} —{" "}
                {formatCurrency(revenueTrend.peak.revenue)}
              </span>
            )}
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Barras: ingresos · Línea: cantidad de pedidos
          </p>
          {revenueTrend.points.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sin pedidos en el período seleccionado.
            </p>
          ) : (
            <RevenueTrendChart points={revenueTrend.points} granularity={revenueTrend.granularity} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Productos más vendidos</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Ranking por unidades vendidas · ingresos estimados al precio actual
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
        </div>

        {!hasItemizedSales && (
          <p className="text-xs text-muted-foreground">
            Los productos y categorías todavía tienen poco detalle de venta: la mayoría de los
            pedidos de datos de referencia no tienen productos individuales cargados. Estas
            secciones se completan automáticamente a medida que entran pedidos reales con detalle
            de carrito.
          </p>
        )}

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Comportamiento de clientes</h2>
          <CustomerStatsPanel stats={customerStats} />
        </div>
      </div>
    </div>
  );
}
