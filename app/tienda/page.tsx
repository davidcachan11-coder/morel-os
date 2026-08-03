"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { categories, products, type CategoryId } from "@/data/catalog";
import { ProductCard } from "@/components/tienda/product-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics-client";

// How long to wait after the visitor stops typing before a SEARCH event
// fires — avoids logging one event per keystroke while still capturing
// real search intent, not every intermediate substring.
const SEARCH_DEBOUNCE_MS = 600;

function parseCategoryParam(value: string | null): CategoryId | "todas" {
  const match = value && categories.find((c) => c.id === value);
  return match ? match.id : "todas";
}

// useSearchParams() (for the ?categoria= entry point from the homepage's
// category-discovery cards) requires a Suspense boundary — split out so
// the default export below can provide one without changing anything
// about this component's own behavior.
function TiendaContent() {
  const searchParams = useSearchParams();
  // Lazy initializer: only read the URL once, on mount — this is an entry
  // point (e.g. from the homepage's category-discovery cards), not a
  // live-synced filter; the chips below are the source of truth for
  // subsequent changes, same as before this param existed.
  const [activeCategory, setActiveCategory] = useState<CategoryId | "todas">(() =>
    parseCategoryParam(searchParams.get("categoria"))
  );
  const [query, setQuery] = useState("");

  // Fires once, only when the visitor actually arrived via a category
  // link (not on every mount) — the manual chip click below already
  // fires this same event for in-page selection.
  const hasTrackedInitialCategory = useRef(false);
  useEffect(() => {
    if (hasTrackedInitialCategory.current) return;
    hasTrackedInitialCategory.current = true;
    if (activeCategory !== "todas") {
      trackEvent("CATEGORY_VIEW", { categoryId: activeCategory });
    }
    // Intentionally runs once on mount only — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    const timer = setTimeout(() => {
      trackEvent("SEARCH", {
        searchQuery: trimmed,
        metadata: { resultCount: filtered.length },
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // filtered is derived from query/activeCategory — depending on the
    // primitives it's computed from (already in this array) is enough;
    // adding the array itself would re-arm the debounce timer whenever
    // the *category* changes mid-search too, which is the desired coupling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeCategory]);

  function handleCategorySelect(category: CategoryId | "todas") {
    setActiveCategory(category);
    if (category !== "todas") {
      trackEvent("CATEGORY_VIEW", { categoryId: category });
    }
  }

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
              onClick={() => handleCategorySelect("todas")}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === "todas"
                  ? "border-brand-green bg-brand-green text-white"
                  : "border-border bg-background text-muted-foreground hover:border-brand-green/40 hover:text-foreground"
              )}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
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
              Prueba con otra búsqueda o elige otra categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TiendaPage() {
  return (
    <Suspense>
      <TiendaContent />
    </Suspense>
  );
}
