import { Boxes } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function InventarioPage() {
  return (
    <PlaceholderPage
      icon={Boxes}
      title="Inventario"
      description="Visibilidad de stock y gestión de existencias por sucursal."
      plannedItems={[
        "Niveles de stock por producto y por sucursal, con umbrales de stock bajo.",
        "Alertas de productos agotados y próximos a agotarse.",
        "Reporte de frecuencia de sustitución, cruzado con la preferencia 'nunca sustituir' capturada en checkout.",
        "Seguimiento de vencimiento/frescura para perecederos.",
      ]}
      dataNote="Esta sección requiere trabajo de backend antes de mostrar datos reales: no existe todavía un modelo de inventario (InventoryItem/InventoryMovement) en la base de datos — Product no tiene ningún campo de cantidad en stock. Ver docs/DASHBOARD_SPEC.md §3. No se muestran datos simulados para evitar sugerir que esta funcionalidad ya existe."
    />
  );
}
