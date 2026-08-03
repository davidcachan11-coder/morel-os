import type { PromoBannerContent, SeasonalCampaignContent } from "@/content/types";
import { getMedia } from "@/content/media-registry";

/**
 * Placeholder seed content proving the promo/campaign pipeline —
 * including the lifecycle fields the Admin Content Manager will
 * eventually control. Real copy/imagery/scheduling is authored per
 * actual campaign, not decided here.
 */
export const promoBanners: PromoBannerContent[] = [
  {
    id: "promo-lo-mejor-temporada",
    status: "published",
    headline: "Lo mejor de la temporada",
    body: "Selección fresca de estación, elegida por nuestros equipos en sucursal.",
    ctaLabel: "Ver la selección",
    ctaHref: "/tienda?categoria=frutas-verduras",
    media: getMedia("promo.default"),
  },
];

/**
 * One example campaign authored with a real future startAt — not
 * rendered anywhere yet (no page reads seasonal campaigns until a later
 * phase), but proves resolveActive() correctly excludes not-yet-started
 * content today without any special-casing.
 */
export const seasonalCampaigns: SeasonalCampaignContent[] = [
  {
    id: "campaign-verano",
    status: "published",
    startAt: "2026-12-01T00:00:00.000Z",
    endAt: "2027-02-28T23:59:59.000Z",
    name: "Verano",
    headline: "Frescura de verano",
    body: "Frutas y verduras de estación para los días de calor.",
    media: getMedia("promo.default"),
  },
];
