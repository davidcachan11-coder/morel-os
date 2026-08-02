import { Inbox } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface TopProduct {
  productId: string;
  name: string;
  emoji: string;
  quantity: number;
  estimatedRevenue: number;
}

export function TopProductsList({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Sin datos para este período</p>
        <p className="text-xs text-muted-foreground">
          Ningún producto tiene detalle de venta todavía en este período.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {products.map((product, index) => (
        <div
          key={product.productId}
          className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {index + 1}
          </span>
          <span className="text-lg">{product.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.quantity} unidades</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-foreground">
            {formatCurrency(product.estimatedRevenue)}
          </span>
        </div>
      ))}
    </div>
  );
}
