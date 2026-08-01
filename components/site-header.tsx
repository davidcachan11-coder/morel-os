"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, LayoutDashboard, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useCartStore, cartCount } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
];

export function SiteHeader() {
  const pathname = usePathname();
  const lines = useCartStore((s) => s.lines);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const count = cartCount(lines);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {pathname !== "/tienda" && (
            <Link href="/tienda">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Ir a la tienda
              </Button>
            </Link>
          )}
          <Link href="/cuenta">
            <Button
              variant="ghost"
              size="sm"
              className="hidden items-center gap-2 sm:inline-flex"
            >
              <User className="h-4 w-4" />
              Mi cuenta
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="relative rounded-full"
            onClick={openDrawer}
            aria-label="Abrir carrito"
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[11px] font-semibold text-white shadow-soft">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
