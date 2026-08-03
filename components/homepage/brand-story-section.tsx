import { MediaImage } from "@/components/media/media-image";
import { FadeIn } from "@/components/motion/fade-in";
import type { HomepageSection } from "@/content/types";

type BrandStorySectionProps = Extract<HomepageSection, { type: "brandStory" }>;

export function BrandStorySection(section: BrandStorySectionProps) {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <FadeIn>
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-green-dark">
            {section.eyebrow}
          </span>
          <h2 className="tracking-display mt-3 text-balance text-3xl font-semibold text-foreground sm:text-4xl">
            {section.headline}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{section.body}</p>
        </FadeIn>
        {section.media && (
          <FadeIn delay={0.1} className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-soft-lg">
            <MediaImage
              asset={section.media}
              fallbackKey="category.default"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </FadeIn>
        )}
      </div>
    </section>
  );
}
