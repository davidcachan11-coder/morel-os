export interface AbandonmentStat {
  label: string;
  abandonedCount: number;
  ratePct: number | null;
}

/** Two compact stat tiles — cart abandonment and checkout abandonment. */
export function AbandonmentSummary({ stats }: { stats: AbandonmentStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border/70 bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {stat.ratePct !== null ? `${stat.ratePct.toFixed(0)}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stat.abandonedCount} {stat.abandonedCount === 1 ? "visitante" : "visitantes"} sin completar
          </p>
        </div>
      ))}
    </div>
  );
}
