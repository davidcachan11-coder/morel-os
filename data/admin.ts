import { type OrderStatusId } from "@/data/orders";

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

export const branches = ["Sucursal Centro", "Sucursal Norte", "Sucursal Yerba Buena"];
export const customerNames = [
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
