"use client";

import Link from "next/link";
import { adminOrders } from "@/data/admin";
import { orderStatusSteps, type OrderStatusId } from "@/data/orders";
import { cn, formatCurrency } from "@/lib/utils";

const columnAccent: Record<OrderStatusId, string> = {
  confirmado: "border-t-brand-navy",
  preparando: "border-t-brand-orange",
  control_calidad: "border-t-brand-indigo",
  en_camino: "border-t-brand-green",
  entregado: "border-t-muted-foreground",
};

export function KanbanBoard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {orderStatusSteps.map((step) => {
        const columnOrders = adminOrders.filter((o) => o.status === step.id);
        return (
          <div
            key={step.id}
            className={cn(
              "flex flex-col rounded-2xl border border-t-4 border-border/70 bg-card/60 p-3 shadow-soft",
              columnAccent[step.id]
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-foreground">{step.label}</h3>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {columnOrders.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {columnOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/pedido/${order.id}`}
                  className="rounded-xl border border-border/70 bg-card p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">#{order.id}</span>
                    <span className="text-[10px] text-muted-foreground">{order.placedAgo}</span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium text-foreground">
                    {order.customerName}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.itemCount} productos</span>
                    <span className="font-semibold text-foreground">{formatCurrency(order.total)}</span>
                  </div>
                  <p className="mt-1.5 truncate text-[10px] text-muted-foreground">{order.branch}</p>
                </Link>
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
