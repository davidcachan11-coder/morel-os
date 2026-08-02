import { Inbox } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface BranchPerformance {
  branchId: string;
  name: string;
  revenue: number;
  orders: number;
  share: number;
}

export function BranchPerformanceList({ branches }: { branches: BranchPerformance[] }) {
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

  const max = Math.max(...branches.map((b) => b.revenue), 1);

  return (
    <div className="flex flex-col gap-3">
      {branches.map((branch) => (
        <div key={branch.branchId}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{branch.name}</span>
            <span className="text-muted-foreground">
              {formatCurrency(branch.revenue)} · {branch.orders}{" "}
              {branch.orders === 1 ? "pedido" : "pedidos"} · {branch.share.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-indigo"
              style={{ width: `${Math.max((branch.revenue / max) * 100, branch.revenue > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
