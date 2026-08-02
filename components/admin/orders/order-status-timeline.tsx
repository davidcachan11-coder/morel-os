import type { OrderStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/components/admin/order-status-ui";

export interface StatusTimelineEvent {
  status: OrderStatus;
  createdAt: Date;
  changedBy: { name: string | null; email: string } | null;
}

export function OrderStatusTimeline({ events }: { events: StatusTimelineEvent[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, index) => (
        <li key={`${event.status}-${event.createdAt.toISOString()}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                "bg-brand-green/15 text-brand-green-dark"
              )}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            {index < events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
          </div>
          <div className="pb-1">
            <p className="text-sm font-medium text-foreground">
              {ORDER_STATUS_LABELS[event.status]}
            </p>
            <p className="text-xs text-muted-foreground">
              {event.createdAt.toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {event.changedBy && ` · ${event.changedBy.name ?? event.changedBy.email}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
