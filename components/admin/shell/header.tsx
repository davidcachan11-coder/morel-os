import type { Role } from "@prisma/client";
import { AdminMobileNav } from "./mobile-nav";
import { AdminUserMenu } from "./user-menu";

export function AdminHeader({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string;
  role: Role;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-card px-4 sm:px-6">
      <AdminMobileNav role={role} />
      <div className="ml-auto flex items-center gap-3">
        <AdminUserMenu name={name} email={email} role={role} />
      </div>
    </header>
  );
}
