import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrdersView = "list" | "board";

/** Same Link-based, no-client-JS pattern as PeriodSelector/SortToggle. */
export function ViewToggle({
  current,
  buildHref,
}: {
  current: OrdersView;
  buildHref: (view: OrdersView) => string;
}) {
  const options: { value: OrdersView; label: string; icon: typeof List }[] = [
    { value: "list", label: "Lista", icon: List },
    { value: "board", label: "Tablero", icon: LayoutGrid },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-0.5">
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === current;
        return (
          <Link
            key={option.value}
            href={buildHref(option.value)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
