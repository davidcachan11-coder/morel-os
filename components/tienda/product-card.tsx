"use client";

import { useEffect, useRef } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { type Product } from "@/data/catalog";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics-client";

export function ProductCard({ product }: { product: Product }) {
  const line = useCartStore((s) => s.lines[product.id]);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);

  const step = product.unit === "kg" ? 0.5 : 1;

  // Customer Intelligence & Growth Analytics — PRODUCT_VIEW as a viewport
  // impression, not a click. There's no product detail page/route today
  // (products only ever render inline as grid cards), so "the card
  // actually scrolled into view" is the honest, real signal available —
  // fired once per mount, not on every scroll back into view.
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTrackedView = useRef(false);
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedView.current) {
          hasTrackedView.current = true;
          trackEvent("PRODUCT_VIEW", { productId: product.id, categoryId: product.category });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [product.id, product.category]);

  return (
    <div ref={cardRef} className="group relative flex flex-col">
      {/* Image area — product-first: a large, plain, flat surface (no
          per-product gradient — that read as generic marketplace
          decoration, not premium photography) with only a subtle scale on
          hover, the same restrained technique the category tiles use. */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-secondary/40">
        {product.popular && (
          <span className="absolute left-3 top-3 z-10 text-[10px] font-semibold uppercase tracking-wide text-brand-green">
            Popular
          </span>
        )}
        <span className="text-6xl transition-transform duration-500 ease-out group-hover:scale-110">
          {product.emoji}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-4">
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
        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
        {/* Price stacked above a full-width action, not side-by-side —
            at 2-column mobile widths a "price + stepper" row had nothing
            to clip it (this card has no bounding container anymore) and
            spilled into the neighboring grid cell. Stacking is robust at
            every column count instead of narrowly fitting one. */}
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-base font-semibold text-foreground">
            {formatCurrency(product.price)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              /{product.unit}
            </span>
          </p>

          {!line ? (
            <Button
              size="sm"
              onClick={() => addItem(product)}
              className="w-full justify-center rounded-full bg-brand-green text-white transition-transform active:scale-95 hover:bg-brand-green-dark"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Agregar
            </Button>
          ) : (
            <div className="flex w-full items-center justify-between rounded-full bg-secondary/60 p-0.5">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full text-foreground transition-transform hover:bg-background active:scale-90"
                onClick={() =>
                  setQuantity(product.id, Math.round((line.quantity - step) * 10) / 10)
                }
                aria-label="Restar"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-center text-xs font-semibold tabular-nums">
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
    </div>
  );
}
