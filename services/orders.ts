"use client";

import { trpcClient } from "@/lib/trpc-client";

export interface StoredOrderSlot {
  id: string;
  dayLabel: string;
  dateLabel: string;
  timeRange: string;
  express?: boolean;
}

export interface StoredOrderItem {
  quantity: number;
  neverSubstitute: boolean;
  product: {
    id: string;
    name: string;
    unit: string;
    price: number;
    emoji: string;
    gradient: string;
  };
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: StoredOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  slot: StoredOrderSlot;
  customerName: string;
}

export interface SaveOrderInput {
  customer: { name: string; email: string; phone: string };
  deliverySlotId: string;
  address: string;
  items: { productId: string; quantity: number; neverSubstitute: boolean }[];
  idempotencyKey: string;
}

export interface SaveOrderResult {
  id: string;
  orderNumber: string;
  createdAt: string;
}

// No `transformer` is configured on initTRPC (server/trpc/trpc.ts), so
// Date/Decimal fields cross the wire as plain strings even though the
// client's inferred type still says Date/Decimal — that inferred type
// describes what the server function returns in TypeScript, not what
// JSON.stringify actually produced. `new Date(...)`/`Number(...)` both
// accept a real Date/Decimal instance *or* the wire string equally
// correctly, so using them here is safe regardless of that mismatch —
// unlike `.toISOString()` or Decimal's own methods, which would throw if
// the value is actually already a plain string.
function toIsoString(value: unknown): string {
  return new Date(value as string | number | Date).toISOString();
}

export async function saveOrder(input: SaveOrderInput): Promise<SaveOrderResult> {
  const order = await trpcClient.orders.saveOrder.mutate(input);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: toIsoString(order.createdAt),
  };
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  const order = await trpcClient.orders.getOrder.query({ id });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: toIsoString(order.createdAt),
    address: order.address,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    total: Number(order.total),
    customerName: order.customer.user.name ?? "Cliente",
    slot: {
      id: order.deliverySlot.id,
      dayLabel: order.deliverySlot.dayLabel,
      dateLabel: order.deliverySlot.dateLabel,
      timeRange: order.deliverySlot.timeRange,
      express: order.deliverySlot.express,
    },
    items: order.items.map((item) => ({
      quantity: Number(item.quantity),
      neverSubstitute: item.neverSubstitute,
      product: {
        id: item.product.id,
        name: item.product.name,
        unit: item.product.unit,
        price: Number(item.product.price),
        emoji: item.product.emoji,
        gradient: item.product.gradient,
      },
    })),
  };
}
