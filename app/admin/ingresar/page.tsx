import { redirect } from "next/navigation";
import { auth } from "@/server/auth/staff";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StaffLoginForm } from "./login-form";

export default async function AdminIngresarPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.mustChangePassword ? "/admin/cambiar-contrasena" : "/admin");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Acceso de personal</CardTitle>
          <CardDescription>
            Ingresa con tu email y contraseña. Este acceso es solo para
            personal de Morel — creado por un administrador, no
            autoregistro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
