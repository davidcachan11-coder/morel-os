import { getFeaturedProducts } from "@/content/provider";
import { ProductCard } from "@/components/tienda/product-card";
import { FadeIn } from "@/components/motion/fade-in";
import type { HomepageSection } from "@/content/types";

type FeaturedProductsSectionProps = Extract<HomepageSection, { type: "featuredProducts" }>;

/**
 * Reuses ProductCard as-is rather than a new homepage-specific card —
 * PRODUCT_VIEW (viewport impression), ADD_TO_CART, and PRODUCT_INTERACTION
 * tracking (Sprint 6) come along automatically, with no duplicate
 * instrumentation to maintain in two places.
 */
export async function FeaturedProductsSection(section: FeaturedProductsSectionProps) {
  const products = await getFeaturedProducts(section.productIds);
  if (products.length === 0) return null;

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="tracking-display text-balance text-3xl font-semibold text-foreground sm:text-4xl">
            {section.headline}
          </h2>
        </FadeIn>
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
