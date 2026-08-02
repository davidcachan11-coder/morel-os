import { ShoppingCart } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function PedidosPage() {
  return (
    <PlaceholderPage
      icon={ShoppingCart}
      title="Pedidos"
      description="Gestión operativa de pedidos — más allá de las métricas agregadas ya disponibles en el Dashboard."
      plannedItems={[
        "Listado y búsqueda de pedidos individuales, con filtros por estado, sucursal y fecha.",
        "Tablero por estado con actualización de estado en línea (hoy solo de lectura vía el enlace de seguimiento público).",
        "Alertas de pedidos detenidos (SLA) por demasiado tiempo en un mismo estado.",
      ]}
      dataNote="Los conteos por estado y el total de pedidos por período ya son reales — están en el Dashboard y en Analítica. Esta sección es para la gestión pedido por pedido, todavía no construida."
    />
  );
}
