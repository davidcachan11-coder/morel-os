import { redirect } from "next/navigation";
import { z } from "zod";
import { hash } from "@node-rs/argon2";
import { auth, ARGON2_OPTIONS } from "@/server/auth/staff";
import { prisma } from "@/server/db/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Length-only minimum, not composition rules (uppercase/digit/symbol
// requirements) — matches current NIST 800-63B guidance over legacy
// complexity rules, and doesn't require an external breach-list check.
const changePasswordSchema = z
  .object({
    password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export default async function CambiarContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/ingresar");
  }
  // Not a self-service "change my password anytime" page — only exists to
  // force the one-time bootstrap/admin-issued temporary password change.
  // Nothing to force once it's already been done.
  if (!session.user.mustChangePassword) {
    redirect("/admin");
  }

  const { error } = await searchParams;

  async function changePassword(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (!currentSession?.user) {
      redirect("/admin/ingresar");
    }

    const parsed = changePasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      redirect("/admin/cambiar-contrasena?error=validation");
    }

    const passwordHash = await hash(parsed.data.password, ARGON2_OPTIONS);
    await prisma.user.update({
      where: { id: currentSession.user.id },
      data: { passwordHash, mustChangePassword: false },
    });

    redirect("/admin");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Elige una nueva contraseña</CardTitle>
          <CardDescription>
            Tu contraseña actual es temporal. Elige una nueva antes de
            continuar — al menos 12 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error === "validation" && (
            <p className="mb-4 text-sm text-destructive">
              Revisa los datos: la contraseña debe tener al menos 12
              caracteres y coincidir en ambos campos.
            </p>
          )}
          <form action={changePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirma la contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar y continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
