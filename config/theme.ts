/**
 * App-level theme configuration. The app is light-mode only by design
 * (see app/globals.css) — this file documents that decision rather than
 * toggling anything at runtime.
 */
export const theme = {
  mode: "light" as const,
  supportsDarkMode: false,
  radius: "0.85rem",
  fonts: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  shadow: {
    soft: "shadow-soft",
    softLg: "shadow-soft-lg",
  },
} as const;
