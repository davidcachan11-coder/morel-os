import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official Morel logo. Same source artwork the brand provided
 * (public/images/brand/morel-logo.png, untouched) — this file
 * (morel-logo-trimmed.png) is a mechanical `sharp().trim()` crop of it,
 * removing the large flat-white margin the original PNG shipped with.
 * Trim only deletes uniform-background border pixels; it does not
 * redraw, recolor, or reshape the mark or wordmark, and the crop was
 * verified by eye against the original (public/images/brand/morel-logo.png
 * is kept on disk for that comparison). Result: 444×378, a much more
 * header-appropriate ratio than the original 1054×1492 (which was mostly
 * whitespace above/below the actual mark).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/images/brand/morel-logo-trimmed.png"
      alt="Supermercado Morel"
      width={444}
      height={378}
      priority
      className={cn("h-12 w-auto sm:h-14", className)}
    />
  );
}
