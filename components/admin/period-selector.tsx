import Link from "next/link";
import { cn } from "@/lib/utils";
import { ANALYTICS_PERIODS, PERIOD_LABELS, type AnalyticsPeriod } from "@/server/analytics/period";

/**
 * Pure Link-based toggle — no client JS needed, works via URL search
 * params (?period=...) the way app/admin/cambiar-contrasena's ?error=
 * pattern already does elsewhere in this codebase. Preset ranges only;
 * see docs/DECISIONS.md's Admin Platform entry for why a custom
 * calendar date-range picker isn't built this round.
 */
export function PeriodSelector({
  currentPeriod,
  currentBranchId,
  basePath,
}: {
  currentPeriod: AnalyticsPeriod;
  currentBranchId?: string;
  basePath: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1">
      {ANALYTICS_PERIODS.map((period) => {
        const params = new URLSearchParams();
        params.set("period", period);
        if (currentBranchId) params.set("branch", currentBranchId);
        const active = period === currentPeriod;
        return (
          <Link
            key={period}
            href={`${basePath}?${params.toString()}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-brand-navy text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {PERIOD_LABELS[period]}
          </Link>
        );
      })}
    </div>
  );
}
