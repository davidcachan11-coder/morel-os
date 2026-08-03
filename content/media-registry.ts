import type { MediaAsset } from "@/types/media";

/**
 * Shared/system imagery — assets not owned by one specific editorial
 * content entry (a fallback used when a content object hasn't set its
 * own `media` field yet, decorative brand textures reused in multiple
 * unrelated places). Per-entry editorial images (a hero's own photo, a
 * specific promo banner's image) live directly on that content object's
 * `media: MediaAsset` field instead — see content/types.ts — since a real
 * CMS's "image field" on a content entry works the same way, not through
 * a side registry.
 *
 * A mix of real photography (hero.composition) and placeholder art
 * direction (the remaining SVG entries, pending real assets for those
 * slots) — swapping any entry here for a different asset is always a
 * one-line edit here, never a component change.
 */
export const MEDIA_REGISTRY = {
  // Real studio photography — the primary hero visual (Stage 1 of
  // revealStages: full composition). A tight, edge-to-edge crop (produce
  // deliberately bleeds off all four sides) chosen specifically so the
  // hero can render it full-bleed/full-viewport instead of as a boxed
  // product shot — this is the "immersive" full-screen hero's source
  // image, not a placeholder.
  "hero.composition": {
    src: "/images/hero/produce-immersive.png",
    alt: "Frutas y verduras frescas en primer plano, composición envolvente",
  },
  // Abstract placeholder — the ultimate fallback only, for the
  // (increasingly unlikely) case a hero ships with zero revealStages and
  // no heroObject of its own set.
  "hero.heroObject": {
    src: "/images/hero/hero-object.svg",
    alt: "Composición premium de productos frescos",
  },
  "category.default": {
    src: "/images/categories/category-placeholder.svg",
    alt: "Categoría de productos",
  },
  "promo.default": {
    src: "/images/promotions/promo-placeholder.svg",
    alt: "Promoción de temporada",
  },
} satisfies Record<string, MediaAsset>;

export type MediaKey = keyof typeof MEDIA_REGISTRY;

export function getMedia(key: MediaKey): MediaAsset {
  return MEDIA_REGISTRY[key];
}
