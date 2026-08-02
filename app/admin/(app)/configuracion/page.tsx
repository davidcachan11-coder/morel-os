import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function ConfiguracionPage() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="Configuración"
      description="Ajustes del sistema, sucursales y preferencias operativas."
      plannedItems={[
        "Administración de sucursales (alta, edición, horarios).",
        "Preferencias de notificaciones (email, WhatsApp) por rol.",
        "Parámetros operativos (tarifa de envío, umbrales de capacidad de entrega).",
      ]}
      dataNote="Todavía no construida — no hay ajustes configurables desde el panel hoy."
    />
  );
}
