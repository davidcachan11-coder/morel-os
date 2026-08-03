import { Truck, ShieldCheck, Lock, Sparkles, type LucideIcon } from "lucide-react";

/**
 * Resolves a TrustPoint.icon string (content/types.ts) to a real
 * lucide-react component at render time. Content stays plain, JSON-safe
 * data (a string), never a component reference — a future Admin Content
 * Manager will store/transmit this the same way. Unrecognized names
 * (e.g. a typo in future-authored content) fall back to Sparkles rather
 * than crashing render.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Truck,
  ShieldCheck,
  Lock,
};

export function resolveTrustIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Sparkles;
}
