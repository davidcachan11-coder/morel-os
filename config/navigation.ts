/**
 * Route/label pairs for the app's navigation surfaces. Mirrors the current
 * links in SiteHeader and SiteFooter exactly (labels intentionally differ
 * between the two surfaces today, so they're kept as separate lists rather
 * than forced into one shared shape).
 */
export interface NavLink {
  href: string;
  label: string;
}

export const primaryNav: NavLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/admin", label: "Panel" },
];

export const footerNav: NavLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/admin", label: "Panel de operaciones" },
];
