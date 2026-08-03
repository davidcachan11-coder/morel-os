import type { HomepageSection } from "@/content/types";
import { HeroSection } from "@/components/homepage/hero-section";
import { BrandStorySection } from "@/components/homepage/brand-story-section";
import { CategoryDiscoverySection } from "@/components/homepage/category-discovery-section";
import { FeaturedProductsSection } from "@/components/homepage/featured-products-section";
import { PromoSection } from "@/components/homepage/promo-section";
import { TrustSection } from "@/components/homepage/trust-section";

/**
 * The switch-on-type dispatcher that makes the homepage a data-driven
 * section list rather than a hardcoded JSX sequence — app/page.tsx maps
 * content.sections through this and nothing else. Adding a new section
 * type later means adding one case here and one content shape
 * (content/types.ts), not touching the page.
 */
export function SectionRenderer({ section }: { section: HomepageSection }) {
  switch (section.type) {
    case "hero":
      return <HeroSection {...section} />;
    case "brandStory":
      return <BrandStorySection {...section} />;
    case "categoryDiscovery":
      return <CategoryDiscoverySection {...section} />;
    case "featuredProducts":
      return <FeaturedProductsSection {...section} />;
    case "promo":
      return <PromoSection {...section} />;
    case "trust":
      return <TrustSection {...section} />;
    default: {
      const exhaustiveCheck: never = section;
      return exhaustiveCheck;
    }
  }
}
