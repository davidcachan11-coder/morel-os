"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORAGE_KEYS } from "@/constants/storage";

interface CheckoutState {
  idempotencyKey: string | null;
  ensureIdempotencyKey: () => string;
  clearIdempotencyKey: () => void;
}

// Persisted separately from lib/cart-store.ts: this is a checkout-session
// concern (survives a refresh mid-checkout so a retry reuses the same
// key), not part of the cart's own domain state.
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      idempotencyKey: null,
      ensureIdempotencyKey: () => {
        const existing = get().idempotencyKey;
        if (existing) return existing;
        const next = crypto.randomUUID();
        set({ idempotencyKey: next });
        return next;
      },
      clearIdempotencyKey: () => set({ idempotencyKey: null }),
    }),
    {
      name: STORAGE_KEYS.checkout,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
