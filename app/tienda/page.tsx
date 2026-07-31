"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { categories, products, type CategoryId } from "@/lib/mock-data";
import { ProductCard } from "@/components/tienda/product-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function TiendaPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId | "todas">("todas");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === "todas" || p.category === activeCategory;
      const matchesQuery =
        query.trim().length === 0 ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand?.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Tienda Morel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} productos disponibles en tu sucursal más cercana.
          </p>

          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tomate, leche, yerba…"
              className="rounded-full border-border bg-background pl-10 pr-9 shadow-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("todas")}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === "todas"
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-border bg-background text-muted-foreground hover:border-brand-navy/40 hover:text-foreground"
              )}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === cat.id
                    ? "border-brand-navy bg-brand-navy text-white"
                    : "border-border bg-background text-muted-foreground hover:border-brand-navy/40 hover:text-foreground"
                )}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <p className="text-lg font-medium text-foreground">Sin resultados</p>
            <p className="text-sm text-muted-foreground">
              Probá con otra búsqueda o elegí otra categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
