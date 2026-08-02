import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function ClientesPage() {
  return (
    <PlaceholderPage
      icon={Users}
      title="Clientes"
      description="Base de clientes — quién compra, con qué frecuencia y su historial completo."
      plannedItems={[
        "Listado y búsqueda de clientes con historial de pedidos.",
        "Cohortes de retención y tasa de recompra a lo largo del tiempo.",
        "Patrones de preferencia de sustitución por cliente.",
        "Seguimiento de soporte/reclamos (todavía no existe ningún canal de soporte en la app).",
      ]}
      dataNote="Las métricas agregadas de clientes (nuevos, activos, recurrentes, gasto promedio, clientes más valiosos) ya son reales y están en Analítica. Esta sección es la vista de cliente individual con historial, todavía no construida."
    />
  );
}
