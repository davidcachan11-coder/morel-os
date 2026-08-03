import Link from "next/link";
import { Logo } from "@/components/logo";
import type { NavContent } from "@/content/types";

export function SiteFooter({ navContent }: { navContent: NavContent }) {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-3">
          {/* self-start: this wrapper is a column flex container, whose
              default align-items:stretch would otherwise force the raw
              <img> (a direct flex child, no wrapping div) to the
              container's full width — an aspect-ratio-preserving w-auto
              image needs an explicit cross-axis alignment to opt out of
              that stretch. */}
          <Logo className="self-start" />
          <p className="max-w-sm text-sm text-muted-foreground">{navContent.footerDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {navContent.footer.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        © 2026 Morel OS · Demo comercial para Supermercados Morel
      </div>
    </footer>
  );
}
