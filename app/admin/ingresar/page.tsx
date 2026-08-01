import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/server/auth/staff";
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

export default async function AdminIngresarPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  async function signInWithCredentials(formData: FormData) {
    "use server";
    const email = formData.get("email");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof password !== "string") return;
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/admin",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/admin/ingresar?error=credentials");
      }
      throw error;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Acceso de personal</CardTitle>
          <CardDescription>
            Ingresá con tu email y contraseña. Este acceso es solo para
            personal de Morel — creado por un administrador, no
            autoregistro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={signInWithCredentials}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Ingresar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
