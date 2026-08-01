import { redirect } from "next/navigation";
import { auth, signOut } from "@/server/auth/customer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CuentaPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/cuenta/ingresar");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl">Mi cuenta</CardTitle>
          <CardDescription>
            {session.user.email ?? session.user.name ?? "Sesión activa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSignOut}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
