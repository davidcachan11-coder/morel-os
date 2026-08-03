"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import type { HeroSceneContent, HeroSceneObject } from "@/content/types";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Renders one HeroSceneObject. `media` is always that item's own real,
 * already-isolated cutout — no crop math, no masking, just the image
 * rendered directly (see HeroSceneObject's doc comment in content/types.ts
 * for why the earlier shared-photo-crop approach was abandoned).
 *
 * Three properties, three independent, never-overlapping mechanisms
 * (learned the hard way earlier this session — see hero-section.tsx's
 * header comment):
 * - rotation: a static inline style, never animated.
 * - opacity: entrance only (initial/animate), staggered by index.
 * - y + scale: scroll-linked only (style, driven by scrollYProgress),
 *   scaled by this object's own `depth` — higher depth drifts and grows
 *   more, reading as "closer to camera."
 */
function HeroSceneObjectLayer({
  object,
  index,
  scrollYProgress,
}: {
  object: HeroSceneObject;
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const sizePx = parseFloat(object.size);

  const depthDistancePx = 24 + object.depth * 28;
  const y = useTransform(scrollYProgress, [0, 1], [0, depthDistancePx]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1 + object.depth * 0.07]);

  return (
    <div
      className="absolute"
      style={{
        top: object.position.top,
        left: object.position.left,
        width: sizePx,
        height: sizePx,
        transform: object.rotation ? `rotate(${object.rotation}deg)` : undefined,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 + index * 0.06, ease: EASE }}
        style={{ y, scale }}
        className="relative h-full w-full"
      >
        <Image
          src={object.media.src}
          alt={object.media.alt}
          fill
          className="object-contain"
          priority={index < 4}
        />
      </motion.div>
    </div>
  );
}

/**
 * The "product reveal" scene — a container of independently-positioned,
 * independently-animated produce objects (HeroContent.scene). See
 * HeroSceneObjectLayer above for how each one renders and animates.
 */
export function HeroScene({
  scene,
  scrollYProgress,
}: {
  scene: HeroSceneContent;
  scrollYProgress: MotionValue<number>;
}) {
  return (
    <div className="relative h-full w-full">
      {scene.objects.map((object, i) => (
        <HeroSceneObjectLayer key={object.id} object={object} index={i} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}
