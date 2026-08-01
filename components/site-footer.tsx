import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            El sistema operativo digital de Supermercados Morel — pedidos, entregas y
            operaciones en una sola plataforma.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <Link href="/tienda" className="hover:text-foreground">Tienda</Link>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        © 2026 Morel OS · Demo comercial para Supermercados Morel
      </div>
    </footer>
  );
}
