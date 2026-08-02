import { UserCog } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default function UsuariosPage() {
  return (
    <PlaceholderPage
      icon={UserCog}
      title="Usuarios y roles"
      description="Gestión de personal, roles y permisos."
      plannedItems={[
        "Invitar y administrar cuentas de personal (hoy solo existe el script de aprovisionamiento inicial).",
        "Revisión y cambio de rol por usuario, respetando la matriz de acceso de BACKEND_ARCHITECTURE.md §7.",
        "Revocación de sesiones activas por administrador (el mecanismo ya existe a nivel de base de datos, falta la interfaz).",
        "Restablecimiento de MFA para un usuario que perdió acceso a su dispositivo.",
      ]}
      dataNote="La autenticación, los roles y la MFA de personal ya son reales y están en producción — esta sección es la interfaz de administración sobre esos sistemas, todavía no construida."
    />
  );
}
