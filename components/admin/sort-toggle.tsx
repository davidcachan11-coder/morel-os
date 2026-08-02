import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SortOption {
  value: string;
  label: string;
}

/**
 * Same Link-based, no-client-JS pattern as PeriodSelector — a sort choice
 * is just another URL search param driving a Server Component re-render.
 */
export function SortToggle({
  options,
  current,
  paramName,
  basePath,
  extraParams,
}: {
  options: SortOption[];
  current: string;
  paramName: string;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-0.5">
      {options.map((option) => {
        const params = new URLSearchParams();
        if (extraParams) {
          for (const [key, value] of Object.entries(extraParams)) {
            if (value) params.set(key, value);
          }
        }
        params.set(paramName, option.value);
        const active = option.value === current;
        return (
          <Link
            key={option.value}
            href={`${basePath}?${params.toString()}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
