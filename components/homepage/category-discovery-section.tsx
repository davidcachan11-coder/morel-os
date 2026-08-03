import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryById } from "@/data/catalog";
import { getCategoryContent } from "@/content/provider";
import { MediaImage } from "@/components/media/media-image";
import { FadeIn } from "@/components/motion/fade-in";
import type { HomepageSection } from "@/content/types";

type CategoryDiscoverySectionProps = Extract<HomepageSection, { type: "categoryDiscovery" }>;

/**
 * Joins editorial content (heroMedia, per-category description — via
 * content/provider.ts) with structural catalog data (name, icon — via
 * data/catalog.ts) at render time. Real category pages (a later phase)
 * are the eventual destination; until they exist, cards link to
 * /tienda?categoria=<id>, which app/tienda/page.tsx reads on load.
 *
 * Editorial-photography treatment: fewer, larger tiles (3 per row, not 6)
 * so each reads as a photograph rather than an icon in a grid; the
 * per-category `icon` is dropped from display entirely (data/catalog.ts
 * still defines one — it's used as a compact category chip in
 * app/tienda/page.tsx's filters — this is just not an "editorial" motif).
 * NOTE: every category here currently falls back to the same
 * `category.default` placeholder SVG (content/categories.ts hasn't been
 * given distinct real photography per category yet) — the layout is
 * built for real photography, but the photography itself is still a
 * placeholder gap, same as the hero's asset history.
 */
export async function CategoryDiscoverySection(section: CategoryDiscoverySectionProps) {
  const contents = await Promise.all(
    section.categoryIds.map((id) => getCategoryContent(id))
  );

  return (
    // id is this section's own content id (content/homepage.ts) — the
    // hero's secondaryCtaHref anchors here ("#category-discovery-main").
    // scroll-mt accounts for the sticky header so the anchored heading
    // isn't hidden behind it.
    <section id={section.id} className="scroll-mt-20 bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="tracking-display text-balance text-3xl font-semibold text-foreground sm:text-4xl">
            {section.headline}
          </h2>
        </FadeIn>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 lg:grid-cols-3">
          {section.categoryIds.map((id, i) => {
            const category = categoryById(id);
            const content = contents[i];
            return (
              <Link
                key={id}
                href={`/tienda?categoria=${id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary/40"
              >
                <MediaImage
                  asset={content?.heroMedia}
                  fallbackKey="category.default"
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                {/* Scrim scoped to the bottom third only — the photograph
                    above it must stay at full intensity, not wash out
                    behind a full-tile overlay (see the hero's own scrim
                    fix for the same reasoning). */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 sm:p-5">
                  <span className="text-lg font-semibold leading-tight text-white sm:text-xl">
                    {category.name}
                  </span>
                  <ArrowRight className="h-4 w-4 -translate-x-1 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
