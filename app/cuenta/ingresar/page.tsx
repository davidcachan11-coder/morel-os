import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { auth, signIn } from "@/server/auth/customer";
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

export default async function IngresarPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/cuenta");
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/cuenta" });
  }

  async function signInWithEmail(formData: FormData) {
    "use server";
    const email = formData.get("email");
    if (typeof email !== "string" || email.length === 0) return;
    try {
      await signIn("resend", { email, redirectTo: "/cuenta" });
    } catch (error) {
      // signIn throws a redirect internally on success — only a genuine
      // AuthError means the sign-in itself failed (e.g. Resend rejected
      // the request). Anything else must propagate, including the
      // redirect Next.js uses under the hood.
      if (error instanceof AuthError) {
        redirect("/cuenta/ingresar?error=email");
      }
      throw error;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Ingresa a tu cuenta</CardTitle>
          <CardDescription>
            Accede con tu cuenta de Google o recibe un enlace de acceso por
            correo — sin contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              Continuar con Google
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            o
            <div className="h-px flex-1 bg-border" />
          </div>

          <form action={signInWithEmail} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@ejemplo.com"
              />
            </div>
            <Button type="submit" className="w-full">
              <Mail className="h-4 w-4" />
              Enviarme un enlace de acceso
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
