import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SalesSummaryStat {
  label: string;
  value: string;
  deltaPct: number | null;
}

function DeltaBadge({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null) {
    return <span className="text-xs font-medium text-muted-foreground">Sin datos previos</span>;
  }
  const positive = deltaPct >= 0;
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-semibold",
        positive ? "text-brand-green-dark" : "text-destructive"
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(deltaPct).toFixed(0)}% vs. período anterior
    </span>
  );
}

/**
 * Compact period-over-period comparison strip for Analytics — visually
 * distinct from the Dashboard's KpiCard grid (dense inline stats, not
 * large cards) so the two pages don't read as the same widget repeated.
 * Reuses analytics.getSummary, already computed for the Dashboard — no
 * new metric, just a different, denser presentation suited to a
 * deep-dive page.
 */
export function SalesSummaryStrip({ stats }: { stats: SalesSummaryStat[] }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-border/70 rounded-2xl border border-border/70 bg-card shadow-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 p-5">
          <span className="text-xs text-muted-foreground">{stat.label}</span>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {stat.value}
          </span>
          <DeltaBadge deltaPct={stat.deltaPct} />
        </div>
      ))}
    </div>
  );
}
