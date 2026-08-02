import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@prisma/client";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  // Undefined = visible to every authenticated staff role, matching
  // today's actual gate (app/admin/(app)/layout.tsx has no per-role check
  // beyond "is staff"). Reserved for BACKEND_ARCHITECTURE.md §7's role→
  // dashboard mapping once per-item enforcement is a real, later decision —
  // not applied yet, so adding a value here today would restrict access
  // the current auth layer doesn't actually enforce.
  roles?: Role[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, description: "Resumen ejecutivo" },
  { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart, description: "Gestión de pedidos" },
  { label: "Productos", href: "/admin/productos", icon: Package, description: "Catálogo" },
  { label: "Inventario", href: "/admin/inventario", icon: Boxes, description: "Stock y existencias" },
  { label: "Clientes", href: "/admin/clientes", icon: Users, description: "Base de clientes" },
  { label: "Analítica", href: "/admin/analitica", icon: BarChart3, description: "Ventas e insights" },
  { label: "Usuarios y roles", href: "/admin/usuarios", icon: UserCog, description: "Personal y permisos" },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings, description: "Ajustes del sistema" },
];
