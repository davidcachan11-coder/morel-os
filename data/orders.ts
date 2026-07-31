import { DELIVERY_FEE } from "@/constants/pricing";
import { products, type Product } from "@/data/catalog";
import { deliverySlots, type DeliverySlot } from "@/data/delivery";

// ---------------------------------------------------------------------------
// Order status vocabulary
// ---------------------------------------------------------------------------

export type OrderStatusId =
  | "confirmado"
  | "preparando"
  | "control_calidad"
  | "en_camino"
  | "entregado";

export interface OrderStatusStep {
  id: OrderStatusId;
  label: string;
  description: string;
}

export const orderStatusSteps: OrderStatusStep[] = [
  { id: "confirmado", label: "Confirmado", description: "Recibimos tu pedido y ya lo estamos procesando." },
  { id: "preparando", label: "Preparando", description: "Nuestro personal está juntando tus productos en tienda." },
  { id: "control_calidad", label: "Control de calidad", description: "Revisamos frescura, vencimientos y sustituciones." },
  { id: "en_camino", label: "En camino", description: "Tu pedido salió de la sucursal hacia tu domicilio." },
  { id: "entregado", label: "Entregado", description: "Tu pedido fue entregado con éxito." },
];

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

export interface Driver {
  name: string;
  vehicle: string;
  plate: string;
  rating: number;
  photoEmoji: string;
  phoneLast4: string;
}

export const mockDriver: Driver = {
  name: "Braian Gómez",
  vehicle: "Fiat Fiorino blanca",
  plate: "AF 204 KP",
  rating: 4.9,
  photoEmoji: "🚚",
  phoneLast4: "3821",
};

// ---------------------------------------------------------------------------
// Demo order
// ---------------------------------------------------------------------------

export interface MockOrderItem {
  product: Product;
  quantity: number;
  neverSubstitute: boolean;
}

export interface MockOrder {
  id: string;
  createdAt: string;
  items: MockOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  slot: DeliverySlot;
  customerName: string;
}

function pick(id: string, quantity: number, neverSubstitute = false): MockOrderItem {
  const product = products.find((p) => p.id === id)!;
  return { product, quantity, neverSubstitute };
}

export const demoOrderItems: MockOrderItem[] = [
  pick("p01", 2),
  pick("p03", 1, true),
  pick("p09", 1.5, true),
  pick("p14", 2),
  pick("p20", 1),
  pick("p26", 1, true),
  pick("p40", 1),
];

export function buildDemoOrder(id: string): MockOrder {
  const subtotal = demoOrderItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  return {
    id,
    createdAt: new Date().toISOString(),
    items: demoOrderItems,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    total: subtotal + DELIVERY_FEE,
    address: "Av. Belgrano 1248, San Miguel de Tucumán",
    slot: deliverySlots[0],
    customerName: "Camila Ferreyra",
  };
}
