import { Package } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function ProductosPage() {
  return (
    <PlaceholderPage
      icon={Package}
      title="Productos"
      description="Administración del catálogo — crear, editar y organizar productos y categorías."
      plannedItems={[
        "Alta, edición y baja de productos y categorías desde el panel.",
        "Gestión de precios, descuentos y disponibilidad por sucursal.",
        "Vista de desempeño por producto (ya disponible como reporte en Analítica).",
      ]}
      dataNote="El catálogo de productos y categorías ya existe y es real — hoy solo es de lectura vía la tienda pública y el reporte de Analítica. Esta sección es la administración editable, todavía no construida."
    />
  );
}
