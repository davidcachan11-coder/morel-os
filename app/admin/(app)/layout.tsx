import { redirect } from "next/navigation";
import { auth } from "@/server/auth/staff";

/**
 * Gate for every staff-only page under /admin — the Sprint 5 PR4 boundary
 * this app has been missing since the demo (docs/DECISIONS.md, PROJECT_STATUS.md's
 * "no auth anywhere" pending item). Deliberately a route-group layout, not
 * a blanket app/admin/layout.tsx: /admin/ingresar and
 * /admin/cambiar-contrasena must stay reachable without a valid session (or,
 * for the latter, while mustChangePassword is still true) — wrapping them
 * in this same check would redirect a signed-out visitor to /admin/ingresar
 * from /admin/ingresar itself, an infinite loop. Next.js route groups add
 * no URL segment (confirmed against next/dist/docs), so this changes
 * nothing about the /admin URL itself.
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

  return <>{children}</>;
}
