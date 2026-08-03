"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useCartStore, cartCount } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import type { NavContent } from "@/content/types";

export function SiteHeader({ navContent }: { navContent: NavContent }) {
  const pathname = usePathname();
  const lines = useCartStore((s) => s.lines);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const count = cartCount(lines);

  // The admin platform (app/admin/(app)/layout.tsx) has its own sidebar +
  // header shell — this storefront header must not stack on top of it.
  // Root layout (app/layout.tsx) renders SiteHeader unconditionally for
  // every route, so the split happens here rather than there, to avoid
  // restructuring the whole app into multiple root layouts for one
  // conditional. /admin/ingresar, /admin/cambiar-contrasena, and
  // /admin/configurar-mfa are also under /admin and correctly get no
  // storefront header either — they're staff-only auth screens, not
  // customer-facing.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        {/* Absolutely centered against the full header width — not the
            midpoint between logo and icons, which would drift off-center
            whenever those two groups differ in width (they do: logo vs.
            three icon buttons). This is the plain-text, no-pill nav an
            Apple-style header uses; only the active link's color changes. */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {navContent.primary.map((link) => {
            // Anchor links (e.g. "/#category-discovery-main") point at a
            // *section* of the homepage, not a distinct route — every one
            // of them shares the homepage's own path ("/"), so comparing
            // just the path portion would mark Inicio/Categorías/Ofertas/
            // Nosotros all "active" simultaneously whenever the visitor is
            // anywhere on "/". There's no scroll-spy to know which section
            // is actually in view, so the honest behavior is: only a
            // plain route link (no "#") can be "active," matched against
            // the full current pathname.
            const isAnchorLink = link.href.includes("#");
            const active = !isAnchorLink && pathname === link.href;
            // "Tienda" carries its own persistent emphasis — a filled
            // pill, always, not just when it's the active route — since
            // it functions as the nav's one shopping CTA among otherwise
            // plain text links, not merely "the current page."
            const isStoreLink = link.href === "/tienda";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isStoreLink
                    ? "rounded-full bg-brand-green px-4 py-1.5 text-white hover:bg-brand-green-dark"
                    : active
                    ? "text-brand-green"
                    : "text-foreground/80 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden rounded-full text-foreground/80 hover:text-foreground sm:inline-flex" aria-label="Buscar">
            <Search className="h-4 w-4" />
          </Button>
          <Link href="/cuenta">
            <Button variant="ghost" size="icon" className="hidden rounded-full text-foreground/80 hover:text-foreground sm:inline-flex" aria-label="Mi cuenta">
              <User className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-foreground/80 hover:text-foreground"
            onClick={openDrawer}
            aria-label="Abrir carrito"
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
