"use client";

import { type CartLine } from "@/lib/cart-store";
import { type DeliverySlot } from "@/lib/mock-data";

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

const STORAGE_KEY = "morel-os:orders";

function readAll(): Record<string, StoredOrder> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveOrder(order: StoredOrder) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[order.id] = order;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getOrder(id: string): StoredOrder | null {
  return readAll()[id] ?? null;
}

export function generateOrderId(): string {
  const num = 70000 + Math.floor(Math.random() * 9999);
  return `MO-${num}`;
}
