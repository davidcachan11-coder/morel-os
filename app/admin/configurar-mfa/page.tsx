import { redirect } from "next/navigation";
import { auth } from "@/server/auth/staff";
import { staffRoleRequiresMfa } from "@/server/auth/mfa";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MfaSetup } from "./mfa-setup";

// Deliberately outside the app/admin/(app) route group, same reasoning as
// /admin/ingresar and /admin/cambiar-contrasena: it must stay reachable
// while the (app) layout's gate would otherwise redirect here, and wrapping
// it in that same gate would loop.
export default async function ConfigurarMfaPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/ingresar");
  }
  if (session.user.mustChangePassword) {
    redirect("/admin/cambiar-contrasena");
  }
  // Not a self-service "reconfigure MFA anytime" page — only exists to
  // force enrollment. Nothing to force once it's already enabled (matches
  // app/admin/cambiar-contrasena's same idempotency check).
  if (session.user.mfaEnabled) {
    redirect("/admin");
  }

  const required = !!session.user.role && staffRoleRequiresMfa(session.user.role);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">
            Activa la verificación en dos pasos
          </CardTitle>
          <CardDescription>
            {required
              ? "Tu rol requiere verificación en dos pasos antes de continuar."
              : "Protege tu cuenta con un paso adicional al iniciar sesión."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSetup />
        </CardContent>
      </Card>
    </div>
  );
}
