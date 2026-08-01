"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Phone, Star, Truck, MapPin, Clock, PackageCheck } from "lucide-react";
import { OrderTimeline } from "@/components/pedido/order-timeline";
import { LiveMap } from "@/components/pedido/live-map";
import { useOrderProgress } from "@/hooks/use-order-progress";
import {
  mockDriver,
  orderStatusSteps,
  type OrderStatusId,
} from "@/data/orders";
import { type StoredOrder } from "@/services/orders";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency, formatQuantity } from "@/lib/utils";

const STAGE_TOASTS: Record<OrderStatusId, string> = {
  confirmado: "Pedido confirmado — ¡gracias por tu compra! ✅",
  preparando: "Estamos preparando tu pedido en sucursal 🛒",
  control_calidad: "Verificando frescura y sustituciones 🔍",
  en_camino: "¡Tu pedido salió a la calle! 🚚",
  entregado: "Pedido entregado con éxito 🎉",
};

export function OrderTracker({ order }: { order: StoredOrder }) {
  const progress = useOrderProgress(order.id, order.statusEvents);
  const announcedStages = useRef<Set<OrderStatusId>>(new Set());
  const announcedMidRoute = useRef(false);

  useEffect(() => {
    if (!announcedStages.current.has(progress.stageId)) {
      announcedStages.current.add(progress.stageId);
      toast.success(STAGE_TOASTS[progress.stageId], {
        description: `Pedido #${order.orderNumber}`,
      });
    }
    if (
      progress.stageId === "en_camino" &&
      progress.driverProgress >= 0.55 &&
      !announcedMidRoute.current
    ) {
      announcedMidRoute.current = true;
      toast.info("El repartidor está a 10 cuadras de tu casa 📍", {
        description: `Pedido #${order.orderNumber}`,
      });
    }
  }, [progress.stageId, progress.driverProgress, order.orderNumber]);

  const currentStep = orderStatusSteps[progress.stageIndex];
  const isEnCamino = progress.stageId === "en_camino";
  const isDelivered = progress.isDelivered;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Pedido</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            #{order.orderNumber}
          </h1>
        </div>
        <div
          className={cn(
            "mt-3 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:mt-0",
            isDelivered
              ? "bg-brand-green/15 text-brand-green-dark"
              : "bg-brand-navy/10 text-brand-navy"
          )}
        >
          {isDelivered ? (
            <PackageCheck className="h-4 w-4" />
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-navy/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-navy" />
            </span>
          )}
          {currentStep.label}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <OrderTimeline stageIndex={progress.stageIndex} />
          </div>

          {isEnCamino && (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-xl">
                {mockDriver.photoEmoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{mockDriver.name}</p>
                <p className="text-xs text-muted-foreground">
                  {mockDriver.vehicle} · {mockDriver.plate}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                  <Star className="h-3 w-3 fill-brand-orange text-brand-orange" />
                  {mockDriver.rating}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  ***{mockDriver.phoneLast4}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative">
            <LiveMap progress={progress.driverProgress} active={isEnCamino || isDelivered} />
            {progress.etaLabel && (
              <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-brand-navy shadow-soft-lg">
                <Clock className="h-3.5 w-3.5" />
                Llega en {progress.etaLabel}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-brand-orange" />
                Entrega
              </div>
              <p className="text-sm text-foreground">{order.address}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.slot.dayLabel} · {order.slot.timeRange}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Pedido para {order.customerName}</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Truck className="h-4 w-4 text-brand-navy" />
                Total del pedido
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <p className="mb-3 text-sm font-semibold text-foreground">
              {order.items.length} productos en tu pedido
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {order.items.map((line) => (
                <div key={line.product.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-lg ${line.product.gradient}`}
                  >
                    {line.product.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {line.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatQuantity(line.quantity, line.product.unit)}
                      {line.neverSubstitute && " · nunca sustituir"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
