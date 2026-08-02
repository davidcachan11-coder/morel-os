import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  DollarSign,
  Inbox,
  Package,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KpiCard } from "@/components/admin/kpi-card";
import { OrderStatusBreakdown } from "@/components/admin/order-status-breakdown";
import { PeriodSelector } from "@/components/admin/period-selector";
import { BranchSelector } from "@/components/admin/branch-selector";
import { AlertsPanel } from "@/components/admin/alerts-panel";
import { RevenueTrendChart } from "@/components/admin/revenue-trend-chart";
import { TopProductsList } from "@/components/admin/top-products-list";
import { BranchPerformanceList } from "@/components/admin/branch-performance-list";
import { RecentActivityList } from "@/components/admin/recent-activity-list";
import { createServerCaller } from "@/server/trpc/caller";
import { ANALYTICS_PERIODS, PERIOD_LABELS, type AnalyticsPeriod } from "@/server/analytics/period";
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; branch?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const branchId = params.branch || undefined;

  const analiticaHref = (() => {
    const qs = new URLSearchParams({ period });
    if (branchId) qs.set("branch", branchId);
    return `/admin/analitica?${qs.toString()}`;
  })();

  const trpc = await createServerCaller();
  const [
    summary,
    statusBreakdown,
    branches,
    alerts,
    revenueTrend,
    topProducts,
    branchPerformance,
    recentActivity,
  ] = await Promise.all([
    trpc.analytics.getSummary({ period, branchId }),
    trpc.analytics.getOrderStatusBreakdown({ period, branchId }),
    trpc.analytics.listBranches(),
    trpc.analytics.getOperationalAlerts({ period, branchId }),
    trpc.analytics.getRevenueTrend({ period, branchId }),
    trpc.analytics.getTopProducts({ period, branchId, limit: 5 }),
    trpc.analytics.getBranchPerformance({ period }),
    trpc.analytics.getRecentActivity({ branchId, limit: 8 }),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Panel ejecutivo
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cómo está el negocio — ventas, pedidos y clientes de un vistazo.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <BranchSelector branches={branches} />
            <PeriodSelector currentPeriod={period} currentBranchId={branchId} basePath="/admin" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <AlertsPanel alerts={alerts} />

        {!summary.previousPeriodHasData && (
          <Alert>
            <AlertCircle />
            <AlertTitle>Sin datos del período anterior</AlertTitle>
            <AlertDescription>
              {PERIOD_LABELS[period]} no tiene un período de comparación con pedidos todavía, así
              que las variaciones porcentuales no se muestran para evitar mostrar una cifra
              inventada. Van a aparecer en cuanto haya historial suficiente.
            </AlertDescription>
          </Alert>
        )}

        {summary.orders.value === 0 ? (
          // A wall of "$0"/"0" cards reads as broken, not as "no activity
          // yet" — when the whole period has zero orders, say that once
          // instead of five times. Real orders.value === 0 elsewhere in
          // this file (chart/pipeline/products/branches) already has its
          // own honest per-widget empty state; this is the KPI-row
          // equivalent.
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Esperando actividad</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              No se registraron pedidos en este período. Los indicadores van a aparecer apenas
              haya actividad.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              icon={DollarSign}
              label="Ingresos totales"
              value={formatCurrency(summary.revenue.value)}
              deltaPct={summary.revenue.deltaPct}
              accent="bg-brand-green/15 text-brand-green-dark"
            />
            <KpiCard
              icon={ClipboardList}
              label="Pedidos"
              value={String(summary.orders.value)}
              deltaPct={summary.orders.deltaPct}
              accent="bg-brand-navy/10 text-brand-navy"
            />
            <KpiCard
              icon={Receipt}
              label="Ticket promedio"
              value={
                summary.averageOrderValue.value !== null
                  ? formatCurrency(summary.averageOrderValue.value)
                  : "—"
              }
              deltaPct={summary.averageOrderValue.deltaPct}
              accent="bg-brand-orange/10 text-brand-orange-dark"
            />
            <KpiCard
              icon={Users}
              label="Clientes activos"
              value={String(summary.customers.value)}
              deltaPct={summary.customers.deltaPct}
              accent="bg-brand-indigo/10 text-brand-indigo"
            />
            <KpiCard
              icon={Package}
              label="Productos vendidos"
              value={String(summary.productsSold.value)}
              deltaPct={summary.productsSold.deltaPct}
              accent="bg-brand-navy/10 text-brand-navy"
            />
          </div>
        )}

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Desempeño de ventas</h2>
            <div className="flex flex-wrap items-center gap-2">
              {revenueTrend.peak && (
                <span className="flex items-center gap-1.5 rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green-dark">
                  <TrendingUp className="h-3 w-3" />
                  Pico: {formatPeakLabel(revenueTrend.peak.bucket, revenueTrend.granularity)} —{" "}
                  {formatCurrency(revenueTrend.peak.revenue)}
                </span>
              )}
              <Link
                href={analiticaHref}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-brand-navy transition-colors hover:bg-muted"
              >
                Ver analítica completa
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Barras: ingresos · Línea: cantidad de pedidos
          </p>
          {revenueTrend.points.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-16 text-center">
              <Inbox className="h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">
                Sin datos para este período
              </p>
              <p className="text-xs text-muted-foreground">
                El gráfico va a aparecer apenas haya pedidos en este período.
              </p>
            </div>
          ) : (
            <RevenueTrendChart points={revenueTrend.points} granularity={revenueTrend.granularity} />
          )}
        </div>

        <OrderStatusBreakdown data={statusBreakdown} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Productos más vendidos</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Top 5 por unidades vendidas en el período
            </p>
            <TopProductsList products={topProducts} />
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Desempeño por sucursal</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Comparación entre sucursales, todo el período (sin filtro de sucursal)
            </p>
            <BranchPerformanceList branches={branchPerformance} />
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <h2 className="mb-1 text-sm font-semibold text-foreground">Actividad reciente</h2>
          <p className="mb-4 text-xs text-muted-foreground">Últimos pedidos, sin importar el período seleccionado</p>
          <RecentActivityList items={recentActivity} />
        </div>
      </div>
    </div>
  );
}
