import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  icon: Icon,
  label,
  value,
  deltaPct,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  deltaPct: number;
  accent: string;
}) {
  const positive = deltaPct >= 0;
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-shadow hover:shadow-soft-lg">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            positive ? "bg-brand-green/15 text-brand-green-dark" : "bg-destructive/10 text-destructive"
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(deltaPct)}%
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
