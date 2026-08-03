"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/media/media-image";
import { HeroScene } from "@/components/homepage/hero-scene";
import type { HeroRevealStage, HomepageSection } from "@/content/types";

type HeroSectionProps = Extract<HomepageSection, { type: "hero" }>;

// Smooth, no-overshoot easing — the only curve used throughout this
// component's entrance choreography, matching FadeIn's existing easing
// elsewhere in the app. Deliberately never a spring/bounce easing —
// "premium, calm, elegant," not playful.
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Splits `headline` around the first occurrence of `highlight`, wrapping
 * that substring in the brand-green accent span — a single accent word
 * for brand recognition, not a general markup system (see
 * HeroContent.headlineHighlight's doc comment in content/types.ts).
 * Renders the plain headline unchanged if `highlight` is absent or
 * doesn't match.
 */
function renderHeadline(headline: string, highlight?: string) {
  if (!highlight) return headline;
  const index = headline.indexOf(highlight);
  if (index === -1) return headline;
  return (
    <>
      {headline.slice(0, index)}
      <span className="text-brand-green">{highlight}</span>
      {headline.slice(index + highlight.length)}
    </>
  );
}

/**
 * One stage of the progressive scroll-zoom reveal (content/types.ts's
 * HeroRevealStage) — its own component, not a function called in a loop,
 * specifically so its useTransform calls stay rules-of-hooks compliant
 * regardless of how many stages the parent renders.
 */
function HeroRevealStageLayer({
  stage,
  index,
  total,
  scrollYProgress,
}: {
  stage: HeroRevealStage;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const segment = 1 / total;
  const rawStart = index * segment;
  const rawEnd = (index + 1) * segment;
  const overlap = segment * 0.2;
  const EPS = 0.0001;

  const p0 = Math.max(0, rawStart - overlap);
  const p1 = Math.min(1, Math.max(p0 + EPS, rawStart + overlap));
  const p2 = Math.max(p1 + EPS, Math.min(1, rawEnd - overlap));
  const p3 = Math.min(1, Math.max(p2 + EPS, rawEnd + overlap));
  const o0 = index === 0 ? 1 : 0;
  const o3 = index === total - 1 ? 1 : 0;

  const opacity = useTransform(scrollYProgress, [p0, p1, p2, p3], [o0, 1, 1, o3]);
  const scale = useTransform(scrollYProgress, [rawStart, rawEnd], [1 + index * 0.35, 1 + (index + 1) * 0.35]);

  return (
    <motion.div style={{ opacity, scale }} className="absolute inset-0">
      <MediaImage
        asset={stage.media}
        fallbackKey="hero.heroObject"
        fill
        priority={index === 0}
        sizes="100vw"
        className="object-cover object-center"
      />
    </motion.div>
  );
}

/**
 * Full-viewport, full-bleed cinematic hero — the produce photography IS
 * the hero (an absolute inset-0 layer behind everything else), not a
 * boxed image sitting in a column next to text. The headline/subhead/CTAs
 * sit on top of it, kept legible by a soft fade-to-background scrim
 * (never a dark overlay — the approved direction is white/studio, not a
 * dimmed banner) rather than being pushed into their own separate
 * ecommerce-style column.
 *
 * Every motion element below drives entrance (`initial`/`animate`) and
 * scroll-linked motion (`style`) on strictly non-overlapping CSS
 * properties — never both on the same property of the same element.
 * Framer Motion resolves conflicting simultaneous control of one property
 * unpredictably (confirmed by hand: nesting a scroll-`style` parent
 * around an `initial`/`animate` child for the *same* property left the
 * child permanently stuck at its `initial` value, no console error). The
 * fix is this flatter structure, not a specific nesting depth — assign
 * each property to exactly one mechanism. `scale`/`y`/`filter` together on
 * one element's `style` is fine — that's still one mechanism (Framer
 * Motion composes transform sub-properties itself); the rule is about
 * never mixing *two* mechanisms on the *same* property.
 *
 * The visual layer renders one of three ways, in priority order:
 * - `section.scene` is set: a "product reveal" scene — many
 *   individually-positioned produce objects, each with its own depth/
 *   parallax/rotation (see components/homepage/hero-scene.tsx). Requires
 *   real isolated per-item cutouts — see content/types.ts's
 *   HeroSceneObject doc comment.
 * - `section.revealStages` has 2+ entries: a progressive scroll-zoom
 *   crossfade through whole-frame stages (composition → individual
 *   product → macro detail — see docs/DECISIONS.md's "Hero macro
 *   photography direction" entry).
 * - Otherwise: `section.heroObject` or a single revealStage — today's
 *   real case — with a continuous scale/drift/blur "camera push" on
 *   scroll, simulating movement through the scene rather than a photo
 *   simply growing.
 *
 * No decorative circles/blobs, no continuous ambient rotation, no dark
 * wash — the produce photography itself is what creates the visual
 * impact, per the approved direction.
 */
export function HeroSection(section: HeroSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Fallback-path-only transforms (no scene): a cinematic "camera push" —
  // zoom, a slight upward drift (simulating the camera traveling through
  // the scene, not just a photo scaling in place), and a late blur as the
  // hero hands off to the next section.
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.65]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -48]);
  const imageBlurPx = useTransform(scrollYProgress, [0.7, 1], [0, 6]);
  const imageBlurFilter = useTransform(imageBlurPx, (v) => `blur(${v}px)`);

  const revealStages = section.revealStages ?? [];
  const hasScene = !!section.scene && section.scene.objects.length > 0;
  const hasMultiStage = !hasScene && revealStages.length >= 2;
  const singleStageMedia = revealStages.length === 1 ? revealStages[0].media : undefined;

  return (
    <section
      ref={ref}
      className="relative isolate min-h-[100dvh] overflow-hidden bg-background"
    >
      {/* Visual — full-bleed, behind everything; the hero object itself,
          not a banner. */}
      <div className="absolute inset-0">
        {hasScene ? (
          <HeroScene scene={section.scene!} scrollYProgress={scrollYProgress} />
        ) : hasMultiStage ? (
          revealStages.map((stage, i) => (
            <HeroRevealStageLayer
              key={i}
              stage={stage}
              index={i}
              total={revealStages.length}
              scrollYProgress={scrollYProgress}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.3, ease: EASE }}
            style={{ scale: imageScale, y: imageY, filter: imageBlurFilter }}
            className="absolute inset-0"
          >
            <MediaImage
              asset={singleStageMedia ?? section.heroObject}
              fallbackKey="hero.heroObject"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </motion.div>
        )}
      </div>

      {/* Legibility scrim — sized to the text block's own footprint only
          (bottom ~46% of the frame on narrow screens where photo stacks
          above text; left ~52% from `lg` up where text sits over the
          image's left side), NOT a full-viewport overlay. The produce
          photography everywhere outside that footprint must stay at full
          intensity — a scrim spanning the whole frame reads as a washed-
          out/faded photo rather than a premium one, which is exactly what
          this is scoped to avoid. Still a fade to the page's own
          off-white background color, never a dark scrim. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-background via-background/85 via-35% to-transparent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-full lg:w-[52%] lg:bg-gradient-to-r lg:from-background lg:via-background/75 lg:via-35% lg:to-transparent"
      />

      {/* Editorial text — integrated with the visual, not a separate
          ecommerce column. */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-4 pb-14 sm:px-6 sm:pb-16 lg:justify-center lg:px-8 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-xl text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
              className="tracking-display whitespace-pre-line text-balance text-5xl font-semibold leading-[1.02] text-foreground sm:text-6xl lg:text-7xl"
            >
              {renderHeadline(section.headline, section.headlineHighlight)}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
              className="mt-5 text-lg text-muted-foreground"
            >
              {section.subheadline}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
              className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Link href={section.ctaHref}>
                <Button size="lg" className="w-full rounded-full bg-brand-green text-white hover:bg-brand-green-dark sm:w-auto">
                  {section.ctaLabel}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              {section.secondaryCtaLabel && section.secondaryCtaHref && (
                <Link href={section.secondaryCtaHref}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-brand-green text-brand-green hover:bg-brand-green/10 sm:w-auto"
                  >
                    {section.secondaryCtaLabel}
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
