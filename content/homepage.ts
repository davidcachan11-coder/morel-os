import type { HomepageContent } from "@/content/types";
import { getMedia } from "@/content/media-registry";

/**
 * Placeholder seed content — proves the HomepageSection/provider pipeline
 * end-to-end (types → content → lifecycle filtering → provider). Real
 * copy, imagery, and section selection are the Homepage rebuild phase's
 * job, not this one; everything here is intentionally minimal and
 * clearly provisional.
 */
export const homepageContent: HomepageContent = {
  sections: [
    {
      id: "hero-main",
      type: "hero",
      status: "published",
      headline: "Tu mercado de siempre,\nahora fresco y hasta tu hogar.",
      headlineHighlight: "fresco",
      subheadline: "Productos frescos y de calidad Morel, directo hasta tu puerta.",
      ctaLabel: "Comprar ahora",
      ctaHref: "/tienda",
      // Scrolls to the category-discovery section below (id matches that
      // section's own content id) rather than duplicating the primary
      // CTA's destination — "explore" and "buy" are genuinely different
      // intents.
      secondaryCtaLabel: "Explorar productos",
      secondaryCtaHref: "#category-discovery-main",
      // No `scene` populated — real per-item isolated cutouts (red pepper,
      // yellow pepper, apple, broccoli, carrot, orange slice, lime,
      // strawberry, raspberry, onion, leafy greens, pineapple) don't exist
      // yet. See content/types.ts's HeroSceneObject doc comment and
      // docs/DECISIONS.md's "Hero scene: real isolated assets required"
      // entry for why an earlier shared-photo-crop version of this was
      // abandoned. Until those assets exist, the single real composition
      // photo below (with its own camera-push motion) is the honest
      // premium option — not a faked "product reveal."
      revealStages: [{ media: getMedia("hero.composition"), label: "Composición completa" }],
    },
    {
      id: "brand-story-main",
      type: "brandStory",
      status: "published",
      eyebrow: "Por qué Morel",
      headline: "Frescura y calidad, elegidas producto por producto.",
      body:
        "Cada pedido se prepara en sucursal, el mismo día, con la misma selección cuidadosa que encontrás en el local.",
    },
    {
      id: "category-discovery-main",
      type: "categoryDiscovery",
      status: "published",
      headline: "Explorá el supermercado",
      categoryIds: [
        "frutas-verduras",
        "carniceria",
        "lacteos-fiambres",
        "panaderia",
        "bebidas",
        "almacen",
      ],
    },
    {
      id: "featured-products-main",
      type: "featuredProducts",
      status: "published",
      headline: "Los favoritos de la semana",
      productIds: ["p01", "p03", "p09", "p14", "p26"],
    },
    {
      id: "promo-temporada",
      type: "promo",
      status: "published",
      headline: "Lo mejor de la temporada",
      body: "Selección fresca de estación, elegida por nuestros equipos en sucursal.",
      ctaLabel: "Ver la selección",
      ctaHref: "/tienda?categoria=frutas-verduras",
      media: getMedia("promo.default"),
    },
    {
      id: "trust-main",
      type: "trust",
      status: "published",
      headline: "Comprar en Morel es simple y seguro",
      points: [
        {
          icon: "Truck",
          label: "Entrega el mismo día",
          description: "Elegí el horario que más te convenga, incluso en 45 minutos.",
        },
        {
          icon: "ShieldCheck",
          label: "Frescura garantizada",
          description: "Si algo no llega en condiciones, lo resolvemos sin vueltas.",
        },
        {
          icon: "Lock",
          label: "Pago seguro",
          description: "Tus datos y tu pago, siempre protegidos.",
        },
      ],
    },
  ],
};
