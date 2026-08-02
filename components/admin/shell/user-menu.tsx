"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import type { Role } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutStaff } from "@/app/admin/(app)/actions";

const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Cliente",
  DRIVER: "Conductor",
  BRANCH_STAFF: "Personal de sucursal",
  BRANCH_MANAGER: "Gerente de sucursal",
  OPS_MANAGER: "Gerente de operaciones",
  FINANCE: "Finanzas",
  MARKETING: "Marketing",
  HR: "Recursos humanos",
  EXECUTIVE: "Ejecutivo",
  ADMIN: "Administrador",
};

export function AdminUserMenu({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string;
  role: Role;
}) {
  const [isPending, startTransition] = useTransition();
  const displayName = name ?? email;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy/10 text-xs font-semibold text-brand-navy outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-brand-navy-light/25 dark:text-brand-navy-light"
        aria-label="Cuenta"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
          <span className="mt-1 w-fit rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            {ROLE_LABELS[role]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => {
              signOutStaff();
            });
          }}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
