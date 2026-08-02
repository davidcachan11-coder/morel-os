"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/services/staff-orders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from "@/components/admin/order-status-ui";

/**
 * Admin-only correction control — sets any status different from the
 * current one, including backward (server/orders/status.ts's
 * isValidStatusTransition allows this only for ADMIN). Deliberately
 * separate from AdvanceStatusButton and only rendered on the order detail
 * page (never on board quick-actions) — this is a deliberate escape
 * hatch for fixing a mistake, not the everyday fulfillment action.
 */
export function AdminStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(value: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, value as OrderStatus);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">Corregir estado (admin)</span>
      <Select value={currentStatus} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUS_SEQUENCE.map((status) => (
            <SelectItem key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
