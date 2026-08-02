import { Inbox } from "lucide-react";

export interface FunnelStage {
  id: string;
  label: string;
  count: number;
  conversionFromStartPct: number | null;
  dropOffFromPrevious: number;
}

/**
 * Ecommerce Funnel Analytics — a horizontal bar per stage (same visual
 * pattern as CustomerStatsPanel's order-count-distribution bars), plus
 * conversion-from-first-stage % and the raw drop-off count since the
 * previous stage. See eventsRouter.getFunnel's own header comment for why
 * these are stage-reach counts, not a strict ordered funnel.
 */
export function FunnelStages({ stages }: { stages: FunnelStage[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const hasAnyData = stages.some((s) => s.count > 0);

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Sin datos para este período</p>
        <p className="text-xs text-muted-foreground">
          Todavía no hay visitas registradas en este período.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-xs text-muted-foreground">{stage.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-lg bg-muted">
            <div
              className="h-full rounded-lg bg-brand-navy"
              style={{
                width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 3 : 0)}%`,
              }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-sm font-semibold text-foreground">
            {stage.count}
          </span>
          <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
            {stage.conversionFromStartPct !== null
              ? `${stage.conversionFromStartPct.toFixed(0)}%`
              : "—"}
          </span>
          <span className="w-20 shrink-0 text-right text-[11px] text-brand-orange-dark">
            {i > 0 && stage.dropOffFromPrevious > 0 ? `-${stage.dropOffFromPrevious}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
