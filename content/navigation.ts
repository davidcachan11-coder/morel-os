import type { NavContent } from "@/content/types";

/**
 * Consolidates what was previously duplicated three ways (SiteHeader's
 * own hardcoded array, SiteFooter's own hardcoded links + description,
 * config/navigation.ts's third, already-slightly-inconsistent copy) into
 * one authored source, now wired into both via getNavContent()
 * (content/provider.ts) → app/layout.tsx.
 *
 * "Categorías", "Ofertas", and "Nosotros" anchor into homepage sections
 * (content/homepage.ts's own section ids) rather than dedicated pages —
 * those pages don't exist yet, and a link that 404s is worse than one
 * that scrolls to the closest real content. Revisit once (if) dedicated
 * routes exist.
 */
export const navigationContent: NavContent = {
  status: "published",
  primary: [
    { href: "/", label: "Inicio" },
    { href: "/#category-discovery-main", label: "Categorías" },
    { href: "/#promo-temporada", label: "Ofertas" },
    { href: "/tienda", label: "Tienda" },
    { href: "/#brand-story-main", label: "Nosotros" },
  ],
  footer: [
    { href: "/", label: "Inicio" },
    { href: "/#category-discovery-main", label: "Categorías" },
    { href: "/tienda", label: "Tienda" },
    { href: "/#brand-story-main", label: "Nosotros" },
  ],
  footerDescription:
    "El sistema operativo digital de Supermercados Morel — pedidos, entregas y operaciones en una sola plataforma.",
};
