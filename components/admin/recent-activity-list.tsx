import type { OrderStatus } from "@prisma/client";
import { Inbox } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export interface RecentActivityItem {
  id: string;
  orderNumber: string;
  customerName: string;
  branchName: string;
  total: number;
  status: OrderStatus | null;
  createdAt: Date;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  CONFIRMADO: "Confirmado",
  PREPARANDO: "Preparando",
  CONTROL_CALIDAD: "Control de calidad",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  CONFIRMADO: "bg-brand-navy/10 text-brand-navy",
  PREPARANDO: "bg-brand-orange/10 text-brand-orange-dark",
  CONTROL_CALIDAD: "bg-brand-indigo/10 text-brand-indigo",
  EN_CAMINO: "bg-brand-green/15 text-brand-green-dark",
  ENTREGADO: "bg-secondary text-secondary-foreground",
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function RecentActivityList({ items }: { items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Esperando actividad</p>
        <p className="text-xs text-muted-foreground">
          Los pedidos van a aparecer acá apenas se registren.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border/70">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">#{item.orderNumber}</span>
              {item.status && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    STATUS_BADGE[item.status]
                  )}
                >
                  {STATUS_LABELS[item.status]}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.customerName} · {item.branchName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-foreground">{formatCurrency(item.total)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatRelativeTime(item.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
