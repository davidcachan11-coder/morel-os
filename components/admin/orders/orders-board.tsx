import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from "@/components/admin/order-status-ui";
import { AdvanceStatusButton } from "./advance-status-button";
import type { StaffOrderRow } from "./orders-table";

const COLUMN_ACCENT: Record<OrderStatus, string> = {
  CONFIRMADO: "border-t-brand-navy",
  PREPARANDO: "border-t-brand-orange",
  CONTROL_CALIDAD: "border-t-brand-indigo",
  EN_CAMINO: "border-t-brand-green",
  ENTREGADO: "border-t-muted-foreground",
};

/**
 * The fulfillment workflow surface — grouped by current status, each card
 * with a one-click "advance" action. Unlike OrdersTable, this view isn't
 * paginated (the page fetches a larger, unpaginated-feeling batch for
 * "board" mode — see app/admin/pedidos/page.tsx): the point of a board is
 * seeing everything currently in flight, not a page of it.
 */
export function OrdersBoard({ orders }: { orders: StaffOrderRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {ORDER_STATUS_SEQUENCE.map((status) => {
        const columnOrders = orders.filter((order) => order.status === status);
        return (
          <div
            key={status}
            className={cn(
              "flex flex-col rounded-2xl border border-t-4 border-border/70 bg-card/60 p-3 shadow-soft",
              COLUMN_ACCENT[status]
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-foreground">
                {ORDER_STATUS_LABELS[status]}
              </h3>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {columnOrders.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {columnOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-border/70 bg-card p-3 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="text-xs font-semibold text-brand-navy hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(order.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium text-foreground">
                    {order.customerName}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{order.branchName}</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  {order.status && (
                    <div className="mt-3">
                      <AdvanceStatusButton
                        orderId={order.id}
                        currentStatus={order.status}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              ))}
              {columnOrders.length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">Sin pedidos</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
