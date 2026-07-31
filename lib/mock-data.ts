import {
  Apple,
  Beef,
  Milk,
  Croissant,
  CupSoda,
  SprayCan,
  Baby,
  Snowflake,
  Package,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type CategoryId =
  | "frutas-verduras"
  | "carniceria"
  | "lacteos-fiambres"
  | "panaderia"
  | "almacen"
  | "bebidas"
  | "congelados"
  | "limpieza"
  | "perfumeria"
  | "bebes";

export interface Category {
  id: CategoryId;
  name: string;
  icon: LucideIcon;
  gradient: string;
}

export const categories: Category[] = [
  { id: "frutas-verduras", name: "Frutas y Verduras", icon: Apple, gradient: "from-emerald-400 to-green-600" },
  { id: "carniceria", name: "Carnicería", icon: Beef, gradient: "from-rose-400 to-red-600" },
  { id: "lacteos-fiambres", name: "Lácteos y Fiambres", icon: Milk, gradient: "from-sky-300 to-blue-500" },
  { id: "panaderia", name: "Panadería", icon: Croissant, gradient: "from-amber-300 to-orange-500" },
  { id: "almacen", name: "Almacén", icon: Package, gradient: "from-yellow-400 to-amber-600" },
  { id: "bebidas", name: "Bebidas", icon: CupSoda, gradient: "from-cyan-400 to-teal-600" },
  { id: "congelados", name: "Congelados", icon: Snowflake, gradient: "from-blue-300 to-indigo-500" },
  { id: "limpieza", name: "Limpieza", icon: SprayCan, gradient: "from-violet-400 to-purple-600" },
  { id: "perfumeria", name: "Perfumería", icon: Sparkles, gradient: "from-pink-400 to-fuchsia-600" },
  { id: "bebes", name: "Bebés", icon: Baby, gradient: "from-lime-300 to-emerald-500" },
];

export const categoryById = (id: CategoryId) =>
  categories.find((c) => c.id === id)!;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: CategoryId;
  price: number;
  unit: string;
  emoji: string;
  gradient: string;
  description: string;
  popular?: boolean;
  discountPct?: number;
  substitutable: boolean; // whether this product commonly gets substituted when out of stock
}

export const products: Product[] = [
  // Frutas y Verduras
  { id: "p01", name: "Banana", category: "frutas-verduras", price: 1890, unit: "kg", emoji: "🍌", gradient: "from-yellow-300 to-yellow-500", description: "Banana ecuatoriana, seleccionada a mano.", popular: true, substitutable: true },
  { id: "p02", name: "Tomate redondo", category: "frutas-verduras", price: 2340, unit: "kg", emoji: "🍅", gradient: "from-red-400 to-red-600", description: "Tomate fresco de quinta, ideal para ensaladas.", substitutable: true },
  { id: "p03", name: "Palta hass", category: "frutas-verduras", price: 3990, unit: "kg", emoji: "🥑", gradient: "from-green-500 to-green-700", description: "Palta cremosa a punto, origen Tucumán.", popular: true, substitutable: true },
  { id: "p04", name: "Manzana roja", category: "frutas-verduras", price: 2190, unit: "kg", emoji: "🍎", gradient: "from-red-400 to-rose-600", description: "Manzana Red Delicious, dulce y crocante.", substitutable: true },
  { id: "p05", name: "Papa lavada", category: "frutas-verduras", price: 1290, unit: "kg", emoji: "🥔", gradient: "from-amber-300 to-yellow-600", description: "Papa negra lavada, bolsa por kilo.", substitutable: true },
  { id: "p06", name: "Lechuga mantecosa", category: "frutas-verduras", price: 980, unit: "unidad", emoji: "🥬", gradient: "from-green-400 to-emerald-600", description: "Lechuga fresca de hoja suave.", substitutable: true },
  { id: "p07", name: "Limón", category: "frutas-verduras", price: 2790, unit: "kg", emoji: "🍋", gradient: "from-yellow-300 to-lime-500", description: "Limón tucumano, alto en jugo.", substitutable: true },
  { id: "p08", name: "Zanahoria", category: "frutas-verduras", price: 1150, unit: "kg", emoji: "🥕", gradient: "from-orange-400 to-orange-600", description: "Zanahoria fresca, atado x 1kg.", substitutable: true },

  // Carnicería
  { id: "p09", name: "Asado de tira", category: "carniceria", price: 8990, unit: "kg", emoji: "🥩", gradient: "from-red-500 to-red-700", description: "Corte clásico para el asado del domingo.", popular: true, substitutable: false },
  { id: "p10", name: "Milanesa de nalga", category: "carniceria", price: 9490, unit: "kg", emoji: "🥩", gradient: "from-rose-500 to-red-700", description: "Milanesas finas, listas para freír.", popular: true, substitutable: false },
  { id: "p11", name: "Pechuga de pollo", category: "carniceria", price: 5290, unit: "kg", emoji: "🍗", gradient: "from-orange-300 to-amber-500", description: "Pechuga de pollo sin hueso.", substitutable: false },
  { id: "p12", name: "Carne picada especial", category: "carniceria", price: 6890, unit: "kg", emoji: "🥩", gradient: "from-red-400 to-rose-600", description: "Carne picada fresca del día.", substitutable: false },
  { id: "p13", name: "Chorizo parrillero", category: "carniceria", price: 5990, unit: "kg", emoji: "🌭", gradient: "from-amber-500 to-red-600", description: "Chorizo puro cerdo, receta criolla.", substitutable: false },

  // Lácteos y Fiambres
  { id: "p14", name: "Leche entera", brand: "La Serenísima", category: "lacteos-fiambres", price: 1690, unit: "L", emoji: "🥛", gradient: "from-blue-200 to-sky-400", description: "Leche entera larga vida, sachet 1L.", popular: true, substitutable: true },
  { id: "p15", name: "Yogur bebible", brand: "SanCor", category: "lacteos-fiambres", price: 2190, unit: "1L", emoji: "🧃", gradient: "from-fuchsia-300 to-pink-500", description: "Yogur bebible sabor frutilla.", substitutable: true },
  { id: "p16", name: "Queso cremoso", brand: "La Paulina", category: "lacteos-fiambres", price: 7290, unit: "kg", emoji: "🧀", gradient: "from-yellow-300 to-amber-500", description: "Queso cremoso fraccionado a la vista.", substitutable: false },
  { id: "p17", name: "Jamón cocido natural", brand: "Fiambres Guerrero", category: "lacteos-fiambres", price: 8490, unit: "kg", emoji: "🍖", gradient: "from-pink-300 to-rose-500", description: "Jamón cocido fraccionado, fetas finas.", substitutable: false },
  { id: "p18", name: "Huevos", category: "lacteos-fiambres", price: 3290, unit: "docena", emoji: "🥚", gradient: "from-amber-200 to-yellow-400", description: "Huevos blancos frescos, maple x12.", popular: true, substitutable: true },
  { id: "p19", name: "Manteca", brand: "La Serenísima", category: "lacteos-fiambres", price: 2590, unit: "200g", emoji: "🧈", gradient: "from-yellow-200 to-amber-400", description: "Manteca con sal, pan de 200g.", substitutable: true },

  // Panadería
  { id: "p20", name: "Pan francés", category: "panaderia", price: 2490, unit: "kg", emoji: "🥖", gradient: "from-amber-300 to-yellow-600", description: "Pan francés horneado en el día.", popular: true, substitutable: true },
  { id: "p21", name: "Facturas surtidas", category: "panaderia", price: 3990, unit: "docena", emoji: "🥐", gradient: "from-orange-300 to-amber-500", description: "Media docena dulce, media salada.", substitutable: true },
  { id: "p22", name: "Pan lactal", brand: "Bimbo", category: "panaderia", price: 2890, unit: "unidad", emoji: "🍞", gradient: "from-yellow-300 to-orange-400", description: "Pan lactal blanco, bolsa 500g.", substitutable: true },

  // Almacén
  { id: "p23", name: "Fideos tallarín", brand: "Matarazzo", category: "almacen", price: 1590, unit: "500g", emoji: "🍝", gradient: "from-yellow-300 to-amber-500", description: "Fideos secos al huevo.", popular: true, substitutable: true },
  { id: "p24", name: "Arroz largo fino", brand: "Gallo Oro", category: "almacen", price: 2190, unit: "1kg", emoji: "🍚", gradient: "from-stone-200 to-amber-300", description: "Arroz blanco tipo 000.", substitutable: true },
  { id: "p25", name: "Aceite de girasol", brand: "Natura", category: "almacen", price: 3690, unit: "1.5L", emoji: "🫙", gradient: "from-yellow-400 to-amber-600", description: "Aceite de girasol puro.", popular: true, substitutable: true },
  { id: "p26", name: "Yerba mate", brand: "Playadito", category: "almacen", price: 4990, unit: "1kg", emoji: "🧉", gradient: "from-green-500 to-emerald-700", description: "Yerba mate con palo, origen Misiones.", popular: true, substitutable: false },
  { id: "p27", name: "Azúcar blanca", brand: "Ledesma", category: "almacen", price: 1890, unit: "1kg", emoji: "🍬", gradient: "from-slate-100 to-slate-300", description: "Azúcar blanca refinada.", substitutable: true },
  { id: "p28", name: "Puré de tomate", brand: "Arcor", category: "almacen", price: 1290, unit: "520g", emoji: "🥫", gradient: "from-red-400 to-red-600", description: "Salsa de tomate clásica.", substitutable: true },
  { id: "p29", name: "Café molido", brand: "La Virginia", category: "almacen", price: 5490, unit: "250g", emoji: "☕", gradient: "from-amber-700 to-stone-800", description: "Café tostado y molido, torrado.", substitutable: false },
  { id: "p30", name: "Galletitas de agua", brand: "Express", category: "almacen", price: 1490, unit: "unidad", emoji: "🍪", gradient: "from-amber-200 to-yellow-400", description: "Galletitas de agua clásicas.", substitutable: true },

  // Bebidas
  { id: "p31", name: "Agua mineral sin gas", brand: "Villavicencio", category: "bebidas", price: 1390, unit: "1.5L", emoji: "💧", gradient: "from-sky-200 to-blue-400", description: "Agua mineral natural.", substitutable: true },
  { id: "p32", name: "Gaseosa cola", brand: "Coca-Cola", category: "bebidas", price: 2890, unit: "1.5L", emoji: "🥤", gradient: "from-red-500 to-red-700", description: "Gaseosa línea cola, botella retornable.", popular: true, substitutable: false },
  { id: "p33", name: "Cerveza rubia", brand: "Quilmes", category: "bebidas", price: 2190, unit: "473ml", emoji: "🍺", gradient: "from-amber-400 to-yellow-600", description: "Cerveza lager, lata 473ml.", substitutable: false },
  { id: "p34", name: "Jugo exprimido naranja", brand: "Baggio", category: "bebidas", price: 2490, unit: "1L", emoji: "🧃", gradient: "from-orange-400 to-amber-500", description: "Jugo de naranja exprimido, sin azúcar agregada.", substitutable: true },

  // Congelados
  { id: "p35", name: "Papas bastón congeladas", brand: "McCain", category: "congelados", price: 4290, unit: "1kg", emoji: "🍟", gradient: "from-yellow-300 to-amber-500", description: "Papas prefritas congeladas.", substitutable: true },
  { id: "p36", name: "Medallones de merluza", brand: "Vieníssima", category: "congelados", price: 6490, unit: "600g", emoji: "🐟", gradient: "from-blue-200 to-sky-400", description: "Medallones rebozados de merluza.", substitutable: false },
  { id: "p37", name: "Helado crema americana", brand: "Grido", category: "congelados", price: 5990, unit: "1kg", emoji: "🍦", gradient: "from-amber-200 to-yellow-400", description: "Helado artesanal pote 1kg.", popular: true, substitutable: true },

  // Limpieza
  { id: "p38", name: "Detergente concentrado", brand: "Magistral", category: "limpieza", price: 2390, unit: "750ml", emoji: "🧴", gradient: "from-emerald-300 to-teal-500", description: "Detergente para vajilla, rinde más.", substitutable: true },
  { id: "p39", name: "Lavandina", brand: "Ayudín", category: "limpieza", price: 1590, unit: "1L", emoji: "🧼", gradient: "from-sky-200 to-cyan-400", description: "Lavandina tradicional.", substitutable: true },
  { id: "p40", name: "Papel higiénico x4", brand: "Elite", category: "limpieza", price: 3890, unit: "pack", emoji: "🧻", gradient: "from-slate-100 to-blue-200", description: "Papel higiénico doble hoja, 4 rollos.", popular: true, substitutable: false },

  // Perfumería
  { id: "p41", name: "Shampoo reparador", brand: "Sedal", category: "perfumeria", price: 3290, unit: "400ml", emoji: "🧴", gradient: "from-pink-300 to-fuchsia-500", description: "Shampoo con keratina.", substitutable: true },
  { id: "p42", name: "Jabón en pan", brand: "Dove", category: "perfumeria", price: 1890, unit: "unidad", emoji: "🧼", gradient: "from-blue-200 to-indigo-300", description: "Jabón hidratante, pan x90g.", substitutable: true },

  // Bebés
  { id: "p43", name: "Pañales talle M", brand: "Pampers", category: "bebes", price: 9990, unit: "pack x40", emoji: "👶", gradient: "from-lime-200 to-emerald-400", description: "Pañales premium care, talle M.", substitutable: false },
];

// ---------------------------------------------------------------------------
// Delivery slots
// ---------------------------------------------------------------------------

export interface DeliverySlot {
  id: string;
  dayLabel: string;
  dateLabel: string;
  timeRange: string;
  capacity: "alta" | "media" | "baja" | "completa";
  spotsLeft: number;
  totalSpots: number;
  express?: boolean;
}

export const deliverySlots: DeliverySlot[] = [
  { id: "slot-hoy-express", dayLabel: "Hoy", dateLabel: "30 jul", timeRange: "En 45 min aprox.", capacity: "media", spotsLeft: 4, totalSpots: 10, express: true },
  { id: "slot-hoy-1", dayLabel: "Hoy", dateLabel: "30 jul", timeRange: "18:00 – 20:00", capacity: "baja", spotsLeft: 2, totalSpots: 14 },
  { id: "slot-hoy-2", dayLabel: "Hoy", dateLabel: "30 jul", timeRange: "20:00 – 22:00", capacity: "media", spotsLeft: 6, totalSpots: 14 },
  { id: "slot-manana-1", dayLabel: "Mañana", dateLabel: "31 jul", timeRange: "09:00 – 11:00", capacity: "alta", spotsLeft: 12, totalSpots: 14 },
  { id: "slot-manana-2", dayLabel: "Mañana", dateLabel: "31 jul", timeRange: "11:00 – 13:00", capacity: "alta", spotsLeft: 11, totalSpots: 14 },
  { id: "slot-manana-3", dayLabel: "Mañana", dateLabel: "31 jul", timeRange: "16:00 – 18:00", capacity: "completa", spotsLeft: 0, totalSpots: 14 },
  { id: "slot-sab-1", dayLabel: "Sábado", dateLabel: "1 ago", timeRange: "10:00 – 12:00", capacity: "alta", spotsLeft: 14, totalSpots: 14 },
  { id: "slot-sab-2", dayLabel: "Sábado", dateLabel: "1 ago", timeRange: "14:00 – 16:00", capacity: "media", spotsLeft: 7, totalSpots: 14 },
];

// ---------------------------------------------------------------------------
// Orders / live tracking
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
  const deliveryFee = 1990;
  return {
    id,
    createdAt: new Date().toISOString(),
    items: demoOrderItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    address: "Av. Belgrano 1248, San Miguel de Tucumán",
    slot: deliverySlots[0],
    customerName: "Camila Ferreyra",
  };
}

// ---------------------------------------------------------------------------
// Admin / operations dashboard mock data
// ---------------------------------------------------------------------------

export interface AdminOrder {
  id: string;
  customerName: string;
  itemCount: number;
  total: number;
  status: OrderStatusId;
  placedAgo: string;
  branch: string;
}

const branches = ["Sucursal Centro", "Sucursal Norte", "Sucursal Yerba Buena"];
const customerNames = [
  "Camila Ferreyra", "Martín Ávila", "Lucía Romero", "Facundo Paz", "Sofía Molina",
  "Ignacio Herrera", "Valentina Ríos", "Bruno Acosta", "Julieta Correa", "Tomás Ledesma",
  "Agustina Juárez", "Nicolás Ibáñez", "Milagros Sosa", "Emiliano Torres", "Abril Cabrera",
  "Santiago Villagra", "Renata Núñez", "Franco Quiroga", "Delfina Ponce", "Mateo Bazán",
];

function seededOrders(): AdminOrder[] {
  const statuses: OrderStatusId[] = ["confirmado", "preparando", "control_calidad", "en_camino", "entregado"];
  const counts = [3, 4, 2, 4, 6]; // how many orders per status
  const orders: AdminOrder[] = [];
  let n = 0;
  statuses.forEach((status, si) => {
    for (let i = 0; i < counts[si]; i++) {
      const name = customerNames[n % customerNames.length];
      orders.push({
        id: `MO-7${(3100 + n * 17) % 9999}`,
        customerName: name,
        itemCount: 3 + ((n * 7) % 14),
        total: 8500 + ((n * 3701) % 42000),
        status,
        placedAgo: `${5 + ((n * 11) % 90)} min`,
        branch: branches[n % branches.length],
      });
      n++;
    }
  });
  return orders;
}

export const adminOrders: AdminOrder[] = seededOrders();

export interface WeeklySalesPoint {
  day: string;
  pedidos: number;
  ventas: number;
}

export const weeklySales: WeeklySalesPoint[] = [
  { day: "Lun", pedidos: 142, ventas: 2_180_000 },
  { day: "Mar", pedidos: 158, ventas: 2_360_000 },
  { day: "Mié", pedidos: 134, ventas: 2_040_000 },
  { day: "Jue", pedidos: 171, ventas: 2_610_000 },
  { day: "Vie", pedidos: 203, ventas: 3_120_000 },
  { day: "Sáb", pedidos: 241, ventas: 3_780_000 },
  { day: "Dom", pedidos: 189, ventas: 2_890_000 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatQuantity(qty: number, unit: string): string {
  const isWeight = unit === "kg";
  return isWeight ? `${qty.toLocaleString("es-AR")} kg` : `${qty} ${unit === "unidad" ? "un." : unit}`;
}
