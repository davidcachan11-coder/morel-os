import { FadeIn } from "@/components/motion/fade-in";
import { resolveTrustIcon } from "@/components/homepage/icon-map";
import type { HomepageSection } from "@/content/types";

type TrustSectionProps = Extract<HomepageSection, { type: "trust" }>;

export function TrustSection(section: TrustSectionProps) {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="tracking-display text-balance text-3xl font-semibold text-foreground sm:text-4xl">
            {section.headline}
          </h2>
        </FadeIn>
        {/* No card chrome (border/shadow/background) — generous spacing
            between columns does the separating instead, per the premium
            direction's "avoid heavy borders / excessive shadows." */}
        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {section.points.map((point, i) => {
            const Icon = resolveTrustIcon(point.icon);
            return (
              <FadeIn key={point.label} delay={i * 0.08}>
                <div className="flex h-full flex-col items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green-dark">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{point.label}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {point.description}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
