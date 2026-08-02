import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  buildHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>
        {start}–{end} de {total} pedidos
      </span>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(page - 1, 1))}
          aria-disabled={page <= 1}
          className={cn(
            "rounded-lg border border-border/70 px-2.5 py-1.5 font-medium transition-colors",
            page <= 1
              ? "pointer-events-none opacity-40"
              : "text-foreground hover:bg-muted"
          )}
        >
          Anterior
        </Link>
        <span className="px-2">
          Página {page} de {totalPages}
        </span>
        <Link
          href={buildHref(Math.min(page + 1, totalPages))}
          aria-disabled={page >= totalPages}
          className={cn(
            "rounded-lg border border-border/70 px-2.5 py-1.5 font-medium transition-colors",
            page >= totalPages
              ? "pointer-events-none opacity-40"
              : "text-foreground hover:bg-muted"
          )}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
