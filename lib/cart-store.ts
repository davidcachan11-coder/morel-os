"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type Product } from "@/data/catalog";
import { STORAGE_KEYS } from "@/constants/storage";
import { trackEvent, syncCartSnapshot } from "@/lib/analytics-client";

export interface CartLine {
  product: Product;
  quantity: number;
  neverSubstitute: boolean;
}

interface CartState {
  lines: Record<string, CartLine>;
  isDrawerOpen: boolean;
  selectedSlotId: string | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  toggleNeverSubstitute: (productId: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setSlot: (slotId: string) => void;
  clearCart: () => void;
}

const step = (product: Product) => (product.unit === "kg" ? 0.5 : 1);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
  lines: {},
  isDrawerOpen: false,
  selectedSlotId: null,
  addItem: (product) =>
    set((state) => {
      const existing = state.lines[product.id];
      const quantity = existing ? existing.quantity + step(product) : step(product);
      // Customer Intelligence & Growth Analytics — fired once, the moment
      // a product first enters the cart, not on every subsequent quantity
      // nudge (see setQuantity below), so this stays a meaningful funnel
      // stage rather than an inflated interaction count.
      if (!existing) {
        trackEvent("ADD_TO_CART", {
          productId: product.id,
          categoryId: product.category,
          metadata: { quantity, price: product.price },
        });
      }
      return {
        lines: {
          ...state.lines,
          [product.id]: {
            product,
            quantity,
            neverSubstitute: existing?.neverSubstitute ?? !product.substitutable,
          },
        },
        isDrawerOpen: true,
      };
    }),
  removeItem: (productId) =>
    set((state) => {
      const existing = state.lines[productId];
      if (existing) {
        trackEvent("REMOVE_FROM_CART", {
          productId,
          categoryId: existing.product.category,
          metadata: { quantity: existing.quantity },
        });
      }
      const next = { ...state.lines };
      delete next[productId];
      return { lines: next };
    }),
  setQuantity: (productId, quantity) =>
    set((state) => {
      const existing = state.lines[productId];
      if (quantity <= 0) {
        if (existing) {
          trackEvent("REMOVE_FROM_CART", {
            productId,
            categoryId: existing.product.category,
            metadata: { quantity: existing.quantity },
          });
        }
        const next = { ...state.lines };
        delete next[productId];
        return { lines: next };
      }
      if (!existing) return state;
      // A quantity nudge on an already-cart product, not a fresh add —
      // tracked as an interaction (funnel depth signal), distinct from
      // ADD_TO_CART above.
      trackEvent("PRODUCT_INTERACTION", {
        productId,
        categoryId: existing.product.category,
        metadata: { action: "quantity_change", from: existing.quantity, to: quantity },
      });
      return {
        lines: { ...state.lines, [productId]: { ...existing, quantity } },
      };
    }),
  toggleNeverSubstitute: (productId) =>
    set((state) => {
      const existing = state.lines[productId];
      if (!existing) return state;
      return {
        lines: {
          ...state.lines,
          [productId]: { ...existing, neverSubstitute: !existing.neverSubstitute },
        },
      };
    }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setSlot: (slotId) => set({ selectedSlotId: slotId }),
  clearCart: () => set({ lines: {}, selectedSlotId: null }),
    }),
    {
      name: STORAGE_KEYS.cart,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines, selectedSlotId: state.selectedSlotId }),
    }
  )
);

// Cart Abandonment foundation — a single subscription point rather than
// a syncCartSnapshot() call duplicated inside every action above: any
// action that changes `lines` (including ones added later) is covered
// automatically. `lines` is a new object reference on every real change
// (every action above returns a fresh object), so reference inequality is
// exactly the right check — no deep-equality library needed.
useCartStore.subscribe((state, prevState) => {
  if (state.lines === prevState.lines) return;
  syncCartSnapshot(
    Object.values(state.lines).map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
      neverSubstitute: line.neverSubstitute,
    }))
  );
});

export function cartLinesArray(lines: Record<string, CartLine>): CartLine[] {
  return Object.values(lines).sort((a, b) => a.product.name.localeCompare(b.product.name));
}

export function cartSubtotal(lines: Record<string, CartLine>): number {
  return Object.values(lines).reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );
}

export function cartCount(lines: Record<string, CartLine>): number {
  return Object.keys(lines).length;
}
