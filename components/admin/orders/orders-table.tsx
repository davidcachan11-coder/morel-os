import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { Inbox } from "lucide-react";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS } from "@/components/admin/order-status-ui";

export interface StaffOrderRow {
  id: string;
  orderNumber: string;
  createdAt: Date;
  total: number;
  customerName: string;
  branchName: string;
  status: OrderStatus | null;
}

export function OrdersTable({ orders }: { orders: StaffOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-16 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Sin pedidos</p>
        <p className="text-xs text-muted-foreground">
          Ningún pedido coincide con la búsqueda o los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Pedido</th>
            <th className="py-2 pr-3 font-medium">Cliente</th>
            <th className="py-2 pr-3 font-medium">Sucursal</th>
            <th className="py-2 pr-3 font-medium">Estado</th>
            <th className="py-2 pr-3 font-medium">Total</th>
            <th className="py-2 pl-3 text-right font-medium">Creado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {orders.map((order) => (
            <tr key={order.id} className="transition-colors hover:bg-muted/40">
              <td className="py-3 pr-3">
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="font-medium text-brand-navy hover:underline"
                >
                  #{order.orderNumber}
                </Link>
              </td>
              <td className="py-3 pr-3 text-foreground">{order.customerName}</td>
              <td className="py-3 pr-3 text-muted-foreground">{order.branchName}</td>
              <td className="py-3 pr-3">
                {order.status && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      ORDER_STATUS_BADGE_CLASS[order.status]
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                )}
              </td>
              <td className="py-3 pr-3 font-medium text-foreground">
                {formatCurrency(order.total)}
              </td>
              <td className="py-3 pl-3 text-right text-muted-foreground">
                {formatRelativeTime(order.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
