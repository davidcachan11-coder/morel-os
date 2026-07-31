"use client";

import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { type Product, formatCurrency, formatQuantity } from "@/lib/mock-data";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const line = useCartStore((s) => s.lines[product.id]);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);

  const step = product.unit === "kg" ? 0.5 : 1;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-shadow hover:shadow-soft-lg"
    >
      {product.popular && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-brand-orange px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft">
          <Star className="h-2.5 w-2.5 fill-current" />
          Popular
        </div>
      )}
      <div
        className={cn(
          "flex h-28 items-center justify-center bg-gradient-to-br text-5xl",
          product.gradient
        )}
      >
        <span className="drop-shadow-sm">{product.emoji}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          {product.brand && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm font-semibold leading-tight text-foreground">
            {product.name}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <p className="text-base font-semibold text-foreground">
              {formatCurrency(product.price)}
            </p>
            <p className="text-[11px] text-muted-foreground">por {product.unit}</p>
          </div>

          {!line ? (
            <Button
              size="sm"
              onClick={() => addItem(product)}
              className="rounded-full bg-brand-navy text-white transition-transform active:scale-95 hover:bg-brand-navy-light"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Agregar
            </Button>
          ) : (
            <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 p-0.5">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition-transform hover:bg-background active:scale-90"
                onClick={() =>
                  setQuantity(product.id, Math.round((line.quantity - step) * 10) / 10)
                }
                aria-label="Restar"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums">
                {formatQuantity(line.quantity, product.unit)}
              </span>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition-transform hover:bg-background active:scale-90"
                onClick={() =>
                  setQuantity(product.id, Math.round((line.quantity + step) * 10) / 10)
                }
                aria-label="Sumar"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
