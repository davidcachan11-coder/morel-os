"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/services/staff-orders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from "@/components/admin/order-status-ui";

/**
 * The primary fulfillment action — advance one order to the next status in
 * ORDER_STATUS_SEQUENCE. Used both on the board's quick-action cards and
 * the order detail page. Renders nothing once an order reaches ENTREGADO
 * (nothing further to advance to). Admin's ability to set an arbitrary
 * status (including backward, for corrections) is a separate, detail-page-
 * only control (AdminStatusSelect) — this button always means "forward
 * one step," the overwhelmingly common action for every role.
 */
export function AdvanceStatusButton({
  orderId,
  currentStatus,
  size = "default",
}: {
  orderId: string;
  currentStatus: OrderStatus;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(currentStatus);
  const nextStatus = ORDER_STATUS_SEQUENCE[currentIndex + 1];
  if (!nextStatus) return null;

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, nextStatus);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button size={size} onClick={handleClick} disabled={isPending} className="gap-1.5">
        {isPending ? "Actualizando…" : `Avanzar a "${ORDER_STATUS_LABELS[nextStatus]}"`}
        {!isPending && <ArrowRight className="h-3.5 w-3.5" />}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
