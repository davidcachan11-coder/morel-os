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
import { ORDERS_STAFF_ROLES } from "@/lib/orders-rbac";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  // Undefined = visible to every authenticated staff role. Most items are
  // still unenforced placeholders (app/admin/(app)/layout.tsx only checks
  // "is staff," not which module), so a value here only matters once the
  // module behind it has a real, matching server-side gate — Pedidos is
  // the first: its page and every orders.staff.* procedure both enforce
  // ORDERS_STAFF_ROLES, so hiding it from other roles here isn't
  // decorative, it matches an actual boundary.
  roles?: Role[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, description: "Resumen ejecutivo" },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    icon: ShoppingCart,
    description: "Gestión de pedidos",
    roles: ORDERS_STAFF_ROLES,
  },
  { label: "Productos", href: "/admin/productos", icon: Package, description: "Catálogo" },
  { label: "Inventario", href: "/admin/inventario", icon: Boxes, description: "Stock y existencias" },
  { label: "Clientes", href: "/admin/clientes", icon: Users, description: "Base de clientes" },
  { label: "Analítica", href: "/admin/analitica", icon: BarChart3, description: "Ventas e insights" },
  { label: "Usuarios y roles", href: "/admin/usuarios", icon: UserCog, description: "Personal y permisos" },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings, description: "Ajustes del sistema" },
];
