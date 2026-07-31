import { type CartLine, cartSubtotal } from "@/lib/cart-store";
import { type DeliverySlot } from "@/data/delivery";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import { DELIVERY_FEE } from "@/constants/pricing";

export function CheckoutSummary({
  lines,
  slot,
}: {
  lines: CartLine[];
  slot?: DeliverySlot | null;
}) {
  const subtotal = cartSubtotal(
    Object.fromEntries(lines.map((l) => [l.product.id, l]))
  );
  const total = subtotal + DELIVERY_FEE;

  return (
    <div className="sticky top-24 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <h2 className="text-sm font-semibold text-foreground">Resumen del pedido</h2>
      <div className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
        {lines.map((line) => (
          <div key={line.product.id} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-base ${line.product.gradient}`}
            >
              {line.product.emoji}
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-xs font-medium text-foreground">{line.product.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatQuantity(line.quantity, line.product.unit)}
              </p>
            </div>
            <p className="text-xs font-medium text-foreground">
              {formatCurrency(line.product.price * line.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Envío</span>
          <span>{formatCurrency(DELIVERY_FEE)}</span>
        </div>
        {slot && (
          <div className="flex justify-between text-muted-foreground">
            <span>Entrega</span>
            <span className="text-right text-foreground">
              {slot.dayLabel} · {slot.timeRange}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
