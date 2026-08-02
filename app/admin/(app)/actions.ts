"use server";

import { signOut } from "@/server/auth/staff";

export async function signOutStaff() {
  await signOut({ redirectTo: "/admin/ingresar" });
}
