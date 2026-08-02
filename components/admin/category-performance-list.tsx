import { Inbox } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface CategoryPerformance {
  categoryId: string;
  name: string;
  quantity: number;
  estimatedRevenue: number;
  share: number;
}

export function CategoryPerformanceList({
  categories,
}: {
  categories: CategoryPerformance[];
}) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Sin datos para este período</p>
        <p className="text-xs text-muted-foreground">
          Ninguna categoría tiene detalle de venta todavía en este período.
        </p>
      </div>
    );
  }

  const max = Math.max(...categories.map((c) => c.estimatedRevenue), 1);

  return (
    <div className="flex flex-col gap-3">
      {categories.map((category) => (
        <div key={category.categoryId}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{category.name}</span>
            <span className="text-muted-foreground">
              {formatCurrency(category.estimatedRevenue)} · {category.quantity} un. ·{" "}
              {category.share.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-navy"
              style={{ width: `${Math.max((category.estimatedRevenue / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
