"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type Product } from "@/data/catalog";
import { STORAGE_KEYS } from "@/constants/storage";

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
      const next = { ...state.lines };
      delete next[productId];
      return { lines: next };
    }),
  setQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        const next = { ...state.lines };
        delete next[productId];
        return { lines: next };
      }
      const existing = state.lines[productId];
      if (!existing) return state;
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
