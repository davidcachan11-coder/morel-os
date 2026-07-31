"use client";

import { useEffect, useState } from "react";
import { OrderTracker } from "@/components/pedido/order-tracker";
import { getOrder, type StoredOrder } from "@/services/orders";
import { buildDemoOrder } from "@/data/orders";

export function OrderTrackerLoader({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<StoredOrder | null>(null);

  useEffect(() => {
    // localStorage is only readable client-side; this syncs it in on mount
    // so SSR and the first client render both start from the same null state.
    const stored = getOrder(orderId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(stored ?? buildDemoOrder(orderId));
  }, [orderId]);

  if (!order) {
    return (
      <div className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-4 py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando tu pedido…</p>
        </div>
      </div>
    );
  }

  return <OrderTracker order={order} />;
}
