import type { Schedulable } from "@/content/types";

/**
 * The one place "is this content visible right now" is decided. Every
 * provider function (content/provider.ts) filters through this rather
 * than re-implementing the draft/scheduled check inline — so the rule
 * only exists once, and a future addition (e.g. a "preview as of a given
 * date" admin feature) only has one function to extend.
 */
export function isContentActive(entity: Schedulable, now: Date = new Date()): boolean {
  if (entity.status !== "published") return false;
  if (entity.startAt && now < new Date(entity.startAt)) return false;
  if (entity.endAt && now > new Date(entity.endAt)) return false;
  return true;
}

/** Filters a list down to only currently-active entries, preserving order. */
export function resolveActive<T extends Schedulable>(items: T[], now: Date = new Date()): T[] {
  return items.filter((item) => isContentActive(item, now));
}
