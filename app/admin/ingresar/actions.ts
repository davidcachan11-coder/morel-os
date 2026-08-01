"use server";

import { AuthError } from "next-auth";
import { signIn, verifyStaffPassword } from "@/server/auth/staff";
import { staffRoleRequiresMfa } from "@/server/auth/mfa";

/**
 * Step 1 of staff login: verifies email/password only (same timing-safe
 * check authorize() uses) and reports whether a second factor is required,
 * without creating any session. The client (login-form.tsx) uses this to
 * decide whether to render the TOTP/recovery-code step — see
 * docs/DECISIONS.md's MFA entry for why this two-step shape exists instead
 * of a single combined form (the client doesn't know in advance whether an
 * account has MFA enrolled).
 */
export async function checkNeedsSecondFactor(
  email: string,
  password: string
): Promise<{ ok: boolean; needsSecondFactor: boolean }> {
  const user = await verifyStaffPassword(email, password);
  if (!user) return { ok: false, needsSecondFactor: false };
  return {
    ok: true,
    needsSecondFactor: staffRoleRequiresMfa(user.role) && user.mfaEnabled,
  };
}

/**
 * Completes staff login. Re-verifies the password (authorize() doesn't
 * trust step 1's result — that check only existed to drive the UI) and,
 * for accounts with MFA enrolled, the totpCode or recoveryCode supplied.
 * Redirects to /admin on success; returns an error instead of redirecting
 * on failure, so the client can show it without losing step-2 form state.
 */
export async function signInStaff(input: {
  email: string;
  password: string;
  totpCode?: string;
  recoveryCode?: string;
}): Promise<{ error: string } | undefined> {
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      totpCode: input.totpCode ?? "",
      recoveryCode: input.recoveryCode ?? "",
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "credentials" };
    }
    throw error;
  }
}
