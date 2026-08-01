"use client";

import { trpcClient } from "@/lib/trpc-client";
import { type OrderStatusId } from "@/data/orders";

export interface StoredOrderStatusEvent {
  status: OrderStatusId;
  createdAt: string;
}

// The server's OrderStatus enum values (Prisma) — mapped here, not
// imported from @prisma/client, so this client-side module stays
// decoupled from Prisma's types (matching the rest of this file: no
// Prisma imports anywhere else either).
function mapOrderStatus(status: string): OrderStatusId {
  switch (status) {
    case "CONFIRMADO":
      return "confirmado";
    case "PREPARANDO":
      return "preparando";
    case "CONTROL_CALIDAD":
      return "control_calidad";
    case "EN_CAMINO":
      return "en_camino";
    case "ENTREGADO":
      return "entregado";
    default:
      return "confirmado";
  }
}

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
  statusEvents: StoredOrderStatusEvent[];
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
    statusEvents: order.statusEvents.map((event) => ({
      status: mapOrderStatus(event.status),
      createdAt: toIsoString(event.createdAt),
    })),
  };
}

// Dedicated poll target for hooks/use-order-progress.ts — see
// server/trpc/routers/orders.ts's getOrderStatus for why this isn't a
// re-use of getOrder's full query.
export async function getOrderStatus(
  id: string
): Promise<{ statusEvents: StoredOrderStatusEvent[] } | null> {
  const order = await trpcClient.orders.getOrderStatus.query({ id });
  if (!order) return null;

  return {
    statusEvents: order.statusEvents.map((event) => ({
      status: mapOrderStatus(event.status),
      createdAt: toIsoString(event.createdAt),
    })),
  };
}
