/**
 * Brand identity constants — name, copy, and the brand color scale.
 * Colors reference the CSS custom properties defined in app/globals.css
 * (the design tokens themselves are not duplicated here).
 */
export const brand = {
  name: "Morel OS",
  shortName: "Morel",
  logoInitial: "M",
  tagline: "El sistema operativo digital de Supermercados Morel",
  description:
    "Pedidos online, seguimiento en vivo y operaciones inteligentes para Supermercados Morel.",
  footerDescription:
    "El sistema operativo digital de Supermercados Morel — pedidos, entregas y operaciones en una sola plataforma.",
  colors: {
    navy: "var(--brand-navy)",
    navyLight: "var(--brand-navy-light)",
    indigo: "var(--brand-indigo)",
    green: "var(--brand-green)",
    greenDark: "var(--brand-green-dark)",
    orange: "var(--brand-orange)",
    orangeDark: "var(--brand-orange-dark)",
  },
} as const;
