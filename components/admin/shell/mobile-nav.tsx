"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminNavLinks } from "./nav-links";

export function AdminMobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="border-b border-border/70">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy text-sm font-bold text-white">
              M
            </div>
            <SheetTitle className="font-heading text-sm font-semibold">Morel OS</SheetTitle>
          </Link>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <AdminNavLinks role={role} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
