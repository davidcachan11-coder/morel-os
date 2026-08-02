import type { OrderStatus } from "@prisma/client";
import { ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from "@/components/admin/order-status-ui";

const ORDERED_STATUSES = ORDER_STATUS_SEQUENCE;

const STATUS_ACCENT: Record<OrderStatus, string> = {
  CONFIRMADO: "border-t-brand-navy",
  PREPARANDO: "border-t-brand-orange",
  CONTROL_CALIDAD: "border-t-brand-indigo",
  EN_CAMINO: "border-t-brand-green",
  ENTREGADO: "border-t-muted-foreground",
};

export interface OrderStatusBreakdownData {
  total: number;
  byStatus: Record<OrderStatus, number>;
  pending: number;
  completed: number;
  cancelled: { count: number; tracked: boolean };
}

export function OrderStatusBreakdown({ data }: { data: OrderStatusBreakdownData }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Flujo de pedidos</h2>
        <span className="text-xs text-muted-foreground">{data.total} pedidos en el período</span>
      </div>

      {data.total === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-foreground">Sin datos para este período</p>
          <p className="text-xs text-muted-foreground">
            El flujo de pedidos va a aparecer apenas haya actividad.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
            {ORDERED_STATUSES.map((status, index) => {
              const count = data.byStatus[status];
              const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
              return (
                <div key={status} className="relative">
                  <div
                    className={cn(
                      "flex h-full flex-col items-center justify-center rounded-xl border-t-4 border-border/70 bg-card/60 px-2 py-4 text-center shadow-soft",
                      STATUS_ACCENT[status]
                    )}
                  >
                    <span className="text-xl font-semibold text-foreground">{count}</span>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {ORDER_STATUS_LABELS[status]}
                    </span>
                    <span className="mt-1 text-[10px] text-muted-foreground/70">{pct}%</span>
                  </div>
                  {index < ORDERED_STATUSES.length - 1 && (
                    <ChevronRight
                      className="absolute top-1/2 -right-2.5 z-10 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/40 sm:block"
                      aria-hidden
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border-t-4 border-dashed border-border px-4 py-4 text-center lg:w-36">
            <span className="text-xl font-semibold text-muted-foreground">N/D</span>
            <span className="mt-1 text-[11px] text-muted-foreground">
              Cancelados
              <br />
              (no rastreado)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
