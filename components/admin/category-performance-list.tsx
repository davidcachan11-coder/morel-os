import { formatCurrency } from "@/lib/utils";

export interface CategoryPerformance {
  categoryId: string;
  name: string;
  quantity: number;
  estimatedRevenue: number;
}

export function CategoryPerformanceList({
  categories,
}: {
  categories: CategoryPerformance[];
}) {
  if (categories.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin ventas con detalle de categoría en el período seleccionado.
      </p>
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
              {formatCurrency(category.estimatedRevenue)} · {category.quantity} un.
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
