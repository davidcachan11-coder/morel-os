import Link from "next/link";
import type { Role } from "@prisma/client";
import { AdminNavLinks } from "./nav-links";

export function AdminSidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-card lg:flex">
      <Link
        href="/admin"
        className="flex h-16 items-center gap-2.5 border-b border-border/70 px-5"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy text-sm font-bold text-white">
          M
        </div>
        <span className="font-heading text-sm font-semibold text-foreground">Morel OS</span>
      </Link>
      <div className="flex-1 overflow-y-auto p-3">
        <AdminNavLinks role={role} />
      </div>
    </aside>
  );
}
