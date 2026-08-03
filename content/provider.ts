import "server-only";

import { resolveActive, isContentActive } from "@/content/lifecycle";
import { navigationContent } from "@/content/navigation";
import { homepageContent } from "@/content/homepage";
import { categoryContent } from "@/content/categories";
import { promoBanners, seasonalCampaigns } from "@/content/promotions";
import { products, type CategoryId, type Product } from "@/data/catalog";
import type {
  NavContent,
  HomepageContent,
  CategoryContent,
  PromoBannerContent,
  SeasonalCampaignContent,
} from "@/content/types";

/**
 * The only place pages/components read content from — never import
 * content/*.ts data files directly. Every function here is `async`, even
 * though today's implementation just reads a static in-memory object:
 * the moment a future Admin Content Manager backs this with a real
 * database, these bodies become real queries and every call site
 * (already written as `await getX()`) needs zero changes. Making these
 * synchronous now would make that migration a breaking one later — the
 * exact kind of rebuild this content layer exists to avoid.
 *
 * `server-only` from day one for the same reason: this will eventually
 * be direct database access, matching every other data-reading module in
 * this codebase (server/analytics/*.ts, server/trpc/routers/*.ts).
 */

export async function getNavContent(): Promise<NavContent> {
  return navigationContent;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  return { sections: resolveActive(homepageContent.sections) };
}

export async function getCategoryContent(categoryId: CategoryId): Promise<CategoryContent | null> {
  const entry = categoryContent.find((c) => c.categoryId === categoryId);
  if (!entry || !isContentActive(entry)) return null;
  return entry;
}

export async function getPromoBanners(): Promise<PromoBannerContent[]> {
  return resolveActive(promoBanners);
}

export async function getActiveSeasonalCampaigns(): Promise<SeasonalCampaignContent[]> {
  return resolveActive(seasonalCampaigns);
}

/**
 * Resolves a content-authored list of product ids against real catalog
 * data — "which products are featured" is content, the product records
 * themselves stay structural. Silently drops any id that no longer
 * matches a real product (a featured product removed from the catalog)
 * rather than throwing — a stale content reference shouldn't break the
 * homepage.
 */
export async function getFeaturedProducts(productIds: string[]): Promise<Product[]> {
  const byId = new Map(products.map((p) => [p.id, p]));
  return productIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => p !== undefined);
}
