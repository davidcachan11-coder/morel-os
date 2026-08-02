import { redirect } from "next/navigation";
import { auth } from "@/server/auth/staff";
import { staffRoleRequiresMfa } from "@/server/auth/mfa";
import { AdminSidebar } from "@/components/admin/shell/sidebar";
import { AdminHeader } from "@/components/admin/shell/header";

/**
 * Gate for every staff-only page under /admin — the Sprint 5 PR4 boundary
 * this app has been missing since the demo (docs/DECISIONS.md, PROJECT_STATUS.md's
 * "no auth anywhere" pending item). Deliberately a route-group layout, not
 * a blanket app/admin/layout.tsx: /admin/ingresar, /admin/cambiar-contrasena,
 * and /admin/configurar-mfa must stay reachable without a valid session (or,
 * for the latter two, while their respective requirement is still unmet) —
 * wrapping them in this same check would redirect a signed-out visitor to
 * /admin/ingresar from /admin/ingresar itself, an infinite loop. Next.js
 * route groups add no URL segment (confirmed against next/dist/docs), so
 * this changes nothing about the /admin URL itself.
 *
 * Checks the staff session only — server/auth/customer.ts is a completely
 * separate Auth.js instance with its own cookie namespace, so a customer
 * session can never satisfy this check.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/ingresar");
  }

  if (session.user.mustChangePassword) {
    redirect("/admin/cambiar-contrasena");
  }

  // SECURITY_ARCHITECTURE.md §4.2: admin/finance/ops_manager MUST NOT reach
  // anything else until MFA is enrolled. authorize() already blocks login
  // outright for accounts that *have* enrolled but fail the TOTP/recovery
  // check — this is the other half, for accounts that haven't enrolled yet,
  // mirroring the mustChangePassword gate immediately above.
  if (
    session.user.role &&
    staffRoleRequiresMfa(session.user.role) &&
    !session.user.mfaEnabled
  ) {
    redirect("/admin/configurar-mfa");
  }

  // Every real staff sign-in (server/auth/staff.ts's authorize()) sets
  // role — this is a fail-closed guard against the field's optional type
  // (shared with the customer session shape, which never sets it), not an
  // expected runtime path.
  if (!session.user.role) {
    redirect("/admin/ingresar");
  }

  return (
    <div className="flex min-h-svh w-full">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          name={session.user.name ?? null}
          email={session.user.email ?? ""}
          role={session.user.role}
        />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
