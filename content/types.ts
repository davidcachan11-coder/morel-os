import type { MediaAsset } from "@/types/media";
import type { CategoryId } from "@/data/catalog";

export type { MediaAsset };

/**
 * Content lifecycle — draft/published plus an optional active window.
 * Every editorial content type below composes this in. Today every
 * shipped content object is `status: "published"` with no start/end
 * dates, so `resolveActive()` (content/lifecycle.ts) is a no-op in
 * practice — but the filtering logic is real and already runs on every
 * read. When a future Admin Content Manager writes a draft or a
 * scheduled campaign with real dates, the same filtering resolves it
 * correctly with no change to this type or the provider functions that
 * use it.
 *
 * `status` is required (not defaulted) so authored content is always
 * explicit about its own lifecycle state — no implicit "no status means
 * published" logic to get subtly wrong later.
 */
export type ContentStatus = "draft" | "published";

export interface Schedulable {
  status: ContentStatus;
  /** ISO 8601 datetime. Omitted = active as soon as published, no start gate. */
  startAt?: string;
  /** ISO 8601 datetime. Omitted = active indefinitely once started. */
  endAt?: string;
}

// ---------------------------------------------------------------------------
// Homepage section content
// ---------------------------------------------------------------------------

export interface HeroContent extends Schedulable {
  id: string;
  headline: string;
  /** An exact substring of `headline` (matched once, first occurrence)
   * to render in the brand green accent instead of the headline's
   * normal navy — a single accent word for brand recognition, not a
   * general rich-text/markup system. Omit for a plain single-color
   * headline. If it doesn't match any substring of `headline` exactly,
   * it's silently ignored and the whole headline renders normally. */
  headlineHighlight?: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  /** Optional ambient backdrop layer. Genuinely optional, not just
   * placeholder-pending-a-real-asset: the approved direction for a
   * studio-photography hero is a plain white/bg-background backdrop with
   * no image at all — a future hero variant that DOES want an
   * environment image can still set this. */
  background?: MediaAsset;
  /** Fallback product visual — used only when neither `scene` nor
   * `revealStages` is populated. */
  heroObject?: MediaAsset;
  /**
   * A "product reveal" scene: many individually-positioned produce
   * objects, each with its own depth/parallax/rotation — not one flat
   * photo moving as a unit. Takes priority over `revealStages` and
   * `heroObject` when populated (today's real case, per the approved
   * "product reveal" direction). See HeroSceneObject below.
   */
  scene?: HeroSceneContent;
  /**
   * Progressive scroll-zoom reveal — full composition → individual
   * product → extreme macro detail. See docs/DECISIONS.md's "Hero macro
   * photography direction" entry for the full creative brief (water
   * droplets, pores, glossy reflections, cinematic focus transitions)
   * this is meant to eventually hold real assets for.
   *
   * Optional: 2+ stages activate a crossfade-and-zoom sequence as the
   * visitor scrolls through the hero. Exactly 1 stage (today's real
   * case — one real studio-photography composition, no staged macro
   * shots yet) renders that single image with a continuous zoom/parallax
   * push-in instead of a crossfade. Only a genuinely empty array falls
   * back to `heroObject`.
   */
  revealStages?: HeroRevealStage[];
}

export interface HeroRevealStage {
  media: MediaAsset;
  /** Editorial label (e.g. "Composición completa", "Detalle macro") —
   * not necessarily rendered on the storefront; useful for a future
   * Admin Content Manager's own stage-ordering UI. */
  label?: string;
}

/**
 * One independently-animated produce item in a hero `scene`
 * (HeroContent.scene). Each object has its own depth, position, and
 * (optional) static rotation — the whole point being that a "product
 * reveal" scene is many individual items with independent movement, not
 * one photo moving as a unit.
 *
 * `media` MUST be that item's own dedicated, already-isolated cutout
 * (a transparent PNG/WebP with clean edges and its real shadow already
 * baked in) — deliberately no crop-from-a-shared-photo escape hatch here.
 * An earlier version let objects share one flattened composition photo
 * via a pixel-rectangle crop, faking independence; every crop still
 * carried its own opaque background, so overlapping objects showed hard
 * rectangular edges, and feathering those edges to hide it produced a
 * "blurred sticker" look — the opposite of the Apple-style product-reveal
 * direction. See docs/DECISIONS.md's "Hero scene: real isolated assets
 * required" entry. Until real per-item cutouts exist, don't populate
 * `scene` at all — HeroSection falls back to `revealStages`/`heroObject`
 * (the single real composition photo, with its own camera-push motion)
 * instead. Faking layers is worse than not having them.
 */
export interface HeroSceneObject {
  id: string;
  media: MediaAsset;
  /** Placement within the scene, as CSS-percentage offsets from the
   * scene container's top-left. */
  position: { top: string; left: string };
  /** Rendered width, e.g. "180px" — height derives from `media`'s own
   * aspect ratio. */
  size: string;
  /**
   * Parallax depth, roughly 1 (furthest/smallest movement) to 3
   * (closest/most movement) — higher values drift and scale up more on
   * scroll and enter with more delay, simulating distance from camera.
   * Matches the brief's "different depth layers, different parallax
   * speeds — background leaves move slowly, large vegetables move
   * closer."
   */
  depth: number;
  /** Static entrance tilt in degrees (e.g. -6 to 6) — never animated
   * continuously, just a fixed "naturally scattered" angle baked in at
   * mount, per "slight rotations," not spinning. */
  rotation?: number;
}

export interface HeroSceneContent {
  objects: HeroSceneObject[];
}

export interface BrandStoryContent extends Schedulable {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  media?: MediaAsset;
}

/** References categories by id — category structural data (name, icon)
 * stays in data/catalog.ts; this only says which categories to feature
 * and in what order, which is an editorial decision. */
export interface CategoryDiscoveryContent extends Schedulable {
  id: string;
  headline: string;
  categoryIds: CategoryId[];
}

/** References products by id, same reasoning as CategoryDiscoveryContent
 * — "which products are featured this week" is content; price/stock/
 * description stays structural catalog data. */
export interface FeaturedProductsContent extends Schedulable {
  id: string;
  headline: string;
  productIds: string[];
}

export interface PromoBannerContent extends Schedulable {
  id: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  media?: MediaAsset;
}

export interface TrustPoint {
  /** lucide-react icon name, resolved to a component at render time via a
   * lookup map — kept as a string here so this stays plain, JSON-safe data. */
  icon: string;
  label: string;
  description: string;
}

export interface TrustContent extends Schedulable {
  id: string;
  headline: string;
  points: TrustPoint[];
}

/**
 * Discriminated union over every section type the homepage can render.
 * The homepage itself is just an ordered array of these — reordering the
 * homepage later means reordering this array (or, once the Admin Content
 * Manager exists, reordering rows in a database), never touching
 * app/page.tsx or any section component.
 */
export type HomepageSection =
  | ({ type: "hero" } & HeroContent)
  | ({ type: "brandStory" } & BrandStoryContent)
  | ({ type: "categoryDiscovery" } & CategoryDiscoveryContent)
  | ({ type: "featuredProducts" } & FeaturedProductsContent)
  | ({ type: "promo" } & PromoBannerContent)
  | ({ type: "trust" } & TrustContent);

export interface HomepageContent {
  sections: HomepageSection[];
}

// ---------------------------------------------------------------------------
// Category page content
// ---------------------------------------------------------------------------

/** Editorial content for one category's page — imagery/description only;
 * the category's name/icon/gradient/product list stays in data/catalog.ts. */
export interface CategoryContent extends Schedulable {
  categoryId: CategoryId;
  heroMedia: MediaAsset;
  description: string;
}

// ---------------------------------------------------------------------------
// Promotions / seasonal campaigns
// ---------------------------------------------------------------------------

export interface SeasonalCampaignContent extends Schedulable {
  id: string;
  name: string;
  headline: string;
  body: string;
  media?: MediaAsset;
  /** Optional — a campaign can be purely narrative (no product tie-in). */
  productIds?: string[];
}

// ---------------------------------------------------------------------------
// Navigation / footer content
// ---------------------------------------------------------------------------

export interface NavLinkContent {
  href: string;
  label: string;
}

/** One record, not per-link — scheduling/drafting an individual nav link
 * isn't a real editorial need today; the whole nav configuration is the
 * unit of content. */
export interface NavContent extends Schedulable {
  primary: NavLinkContent[];
  footer: NavLinkContent[];
  footerDescription: string;
}
