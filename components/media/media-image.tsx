import Image, { type ImageProps } from "next/image";
import { getMedia, type MediaKey } from "@/content/media-registry";
import type { MediaAsset } from "@/types/media";

type MediaImageProps = Omit<ImageProps, "src" | "alt"> & {
  /** The content entity's own image, if it has one (e.g. HeroContent.media). */
  asset?: MediaAsset;
  /** Registry key to fall back to when `asset` is undefined — the site
   * default for that slot, never a raw <img>/<Image> anywhere else. */
  fallbackKey: MediaKey;
};

/**
 * The single rendering seam every page routes image display through —
 * whether the pixels come from a content entity's own `media` field
 * (content/types.ts) or the shared registry (content/media-registry.ts).
 * Swapping placeholder art direction for real AI-generated or
 * photographed assets later means editing content data or the registry,
 * never this component or any of its call sites.
 */
export function MediaImage({ asset, fallbackKey, ...imageProps }: MediaImageProps) {
  const resolved = asset ?? getMedia(fallbackKey);
  return <Image src={resolved.src} alt={resolved.alt} {...imageProps} />;
}
