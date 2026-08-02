import { TrendingDown, TrendingUp } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export interface BranchComparisonRow {
  branchId: string;
  name: string;
  revenue: number;
  orders: number;
  aov: number | null;
  share: number;
  revenueDeltaPct: number | null;
  ordersDeltaPct: number | null;
}

function Delta({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null) return <span className="text-muted-foreground">—</span>;
  const positive = deltaPct >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium",
        positive ? "text-brand-green-dark" : "text-destructive"
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(deltaPct).toFixed(0)}%
    </span>
  );
}

/**
 * Richer than the Dashboard's compact BranchPerformanceList (bars only) —
 * this is Analytics' deep-dive version: AOV and period-over-period deltas
 * per branch, not just current-period revenue/orders/share. Deliberately
 * a separate component rather than a "detailed" prop on the Dashboard one,
 * since the Dashboard's job is a glance, not a table.
 */
export function BranchComparisonTable({ branches }: { branches: BranchComparisonRow[] }) {
  const hasAnyOrders = branches.some((b) => b.orders > 0);

  if (!hasAnyOrders) {
    return (
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Sin datos para este período</p>
        <p className="text-xs text-muted-foreground">
          Ninguna sucursal registró pedidos todavía en este período.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Sucursal</th>
            <th className="py-2 pr-3 font-medium">Ingresos</th>
            <th className="py-2 pr-3 font-medium">Δ ingresos</th>
            <th className="py-2 pr-3 font-medium">Pedidos</th>
            <th className="py-2 pr-3 font-medium">Δ pedidos</th>
            <th className="py-2 pr-3 font-medium">Ticket prom.</th>
            <th className="py-2 pl-3 text-right font-medium">% del total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {branches.map((branch) => (
            <tr key={branch.branchId}>
              <td className="py-3 pr-3 font-medium text-foreground">{branch.name}</td>
              <td className="py-3 pr-3 text-foreground">{formatCurrency(branch.revenue)}</td>
              <td className="py-3 pr-3">
                <Delta deltaPct={branch.revenueDeltaPct} />
              </td>
              <td className="py-3 pr-3 text-foreground">{branch.orders}</td>
              <td className="py-3 pr-3">
                <Delta deltaPct={branch.ordersDeltaPct} />
              </td>
              <td className="py-3 pr-3 text-foreground">
                {branch.aov !== null ? formatCurrency(branch.aov) : "—"}
              </td>
              <td className="py-3 pl-3 text-right text-foreground">{branch.share.toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
