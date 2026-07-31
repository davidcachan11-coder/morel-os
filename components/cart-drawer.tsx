"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  useCartStore,
  cartLinesArray,
  cartSubtotal,
} from "@/lib/cart-store";
import { cn, formatCurrency, formatQuantity } from "@/lib/utils";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const toggleNeverSubstitute = useCartStore((s) => s.toggleNeverSubstitute);

  const items = cartLinesArray(lines);
  const subtotal = cartSubtotal(lines);
  const isEmpty = items.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4 text-brand-navy" />
            Tu carrito
            {!isEmpty && (
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length} {items.length === 1 ? "producto" : "productos"})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Tu carrito está vacío</p>
            <p className="text-sm text-muted-foreground">
              Agregá productos desde la tienda para empezar tu pedido.
            </p>
            <Link href="/tienda">
              <Button className="mt-2" onClick={closeDrawer}>
                Ir a la tienda
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-4">
                {items.map((line) => (
                  <div
                    key={line.product.id}
                    className="flex gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-soft"
                  >
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-2xl",
                        line.product.gradient
                      )}
                    >
                      {line.product.emoji}
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium leading-tight text-foreground">
                            {line.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(line.product.price)} / {line.product.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(line.product.id)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Quitar ${line.product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 p-0.5">
                          <button
                            className="flex h-6 w-6 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background"
                            onClick={() =>
                              setQuantity(
                                line.product.id,
                                Math.round((line.quantity - (line.product.unit === "kg" ? 0.5 : 1)) * 10) / 10
                              )
                            }
                            aria-label="Restar"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums">
                            {formatQuantity(line.quantity, line.product.unit)}
                          </span>
                          <button
                            className="flex h-6 w-6 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background"
                            onClick={() =>
                              setQuantity(
                                line.product.id,
                                Math.round((line.quantity + (line.product.unit === "kg" ? 0.5 : 1)) * 10) / 10
                              )
                            }
                            aria-label="Sumar"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(line.product.price * line.quantity)}
                        </p>
                      </div>

                      <label className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-2 py-1.5">
                        <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                          Nunca sustituir este producto
                        </span>
                        <Switch
                          checked={line.neverSubstitute}
                          onCheckedChange={() => toggleNeverSubstitute(line.product.id)}
                          className="scale-90 data-[state=checked]:bg-brand-orange"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SheetFooter className="flex-col gap-3 border-t border-border px-5 py-4 sm:flex-col">
              <div className="flex w-full items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <Separator />
              <Link href="/tienda/checkout" className="w-full" onClick={closeDrawer}>
                <Button size="lg" className="w-full rounded-full bg-brand-navy text-white hover:bg-brand-navy-light">
                  Continuar compra
                </Button>
              </Link>
              <button
                onClick={closeDrawer}
                className="text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Seguir comprando
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
