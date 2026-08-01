"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageX } from "lucide-react";
import { OrderTracker } from "@/components/pedido/order-tracker";
import { getOrder, type StoredOrder } from "@/services/orders";
import { Button } from "@/components/ui/button";

type LoadStatus = "loading" | "found" | "not-found";

export function OrderTrackerLoader({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setOrder(result);
          setStatus("found");
        } else {
          setStatus("not-found");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("not-found");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (status === "loading") {
    return (
      <div className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-4 py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando tu pedido…</p>
        </div>
      </div>
    );
  }

  if (status === "not-found" || !order) {
    return (
      <div className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <PackageX className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Pedido no encontrado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          No pudimos encontrar un pedido con ese enlace. Verifica que la
          dirección sea correcta.
        </p>
        <Link href="/tienda">
          <Button className="mt-2 rounded-full">Ir a la tienda</Button>
        </Link>
      </div>
    );
  }

  return <OrderTracker order={order} />;
}
