import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/media/media-image";
import { FadeIn } from "@/components/motion/fade-in";
import type { HomepageSection } from "@/content/types";

type PromoSectionProps = Extract<HomepageSection, { type: "promo" }>;

export function PromoSection(section: PromoSectionProps) {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          {/* Same "photography + scoped bottom scrim" language as the
              hero and category tiles — no flat brand-navy block. A
              compact banner's text can sit over a stronger, deeper scrim
              than the full-viewport hero (this is a small anchored card,
              not an immersive photograph you'd otherwise wash out). */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-secondary/40 sm:aspect-[3/1]">
            <MediaImage
              asset={section.media}
              fallbackKey="promo.default"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center sm:p-12">
              <h2 className="tracking-display text-balance text-3xl font-semibold text-white sm:text-4xl">
                {section.headline}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">{section.body}</p>
              {section.ctaLabel && section.ctaHref && (
                <div className="mt-6">
                  <Link href={section.ctaHref}>
                    <Button
                      size="lg"
                      className="rounded-full bg-brand-green text-white hover:bg-brand-green-dark"
                    >
                      {section.ctaLabel}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
