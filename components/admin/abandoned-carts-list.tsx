import { Inbox } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface AbandonedCartItem {
  productId: string;
  quantity: number;
  neverSubstitute: boolean;
  name: string;
  price: number | null;
  emoji: string;
}

export interface AbandonedCart {
  id: string;
  visitorId: string;
  customerName: string | null;
  items: AbandonedCartItem[];
  estimatedValue: number;
  abandonedSince: Date;
  minutesSinceAbandonment: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

/**
 * Cart Abandonment foundation — the current backlog of abandoned carts,
 * oldest first. Purely a listing surface: no recovery action (email/
 * WhatsApp/push) is wired here — that's explicitly future-phase
 * automation, not this foundation.
 */
export function AbandonedCartsList({ carts }: { carts: AbandonedCart[] }) {
  if (carts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-8 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Sin carritos abandonados</p>
        <p className="text-xs text-muted-foreground">
          Ningún carrito activo cumple el criterio de abandono en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {carts.map((cart) => (
        <div
          key={cart.id}
          className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {cart.customerName ?? "Visitante anónimo"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {cart.items.map((item) => `${item.emoji} ${item.name}`).join(", ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-right">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(cart.estimatedValue)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                hace {formatDuration(cart.minutesSinceAbandonment)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
