import type { OrderStatus } from "@prisma/client";
import { Inbox } from "lucide-react";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS } from "@/components/admin/order-status-ui";

export interface RecentActivityItem {
  id: string;
  orderNumber: string;
  customerName: string;
  branchName: string;
  total: number;
  status: OrderStatus | null;
  createdAt: Date;
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
                    ORDER_STATUS_BADGE_CLASS[item.status]
                  )}
                >
                  {ORDER_STATUS_LABELS[item.status]}
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
