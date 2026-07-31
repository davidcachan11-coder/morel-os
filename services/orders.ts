"use client";

import { type CartLine } from "@/lib/cart-store";
import { type DeliverySlot } from "@/data/delivery";
import { STORAGE_KEYS } from "@/constants/storage";

export interface StoredOrder {
  id: string;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  slot: DeliverySlot;
  customerName: string;
}

function readAll(): Record<string, StoredOrder> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.orders);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveOrder(order: StoredOrder) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[order.id] = order;
  window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(all));
}

export function getOrder(id: string): StoredOrder | null {
  return readAll()[id] ?? null;
}

export function generateOrderId(): string {
  const num = 70000 + Math.floor(Math.random() * 9999);
  return `MO-${num}`;
}
