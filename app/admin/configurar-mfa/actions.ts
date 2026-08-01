"use server";

import QRCode from "qrcode";
import { auth } from "@/server/auth/staff";
import { prisma } from "@/server/db/client";
import {
  buildTotpProvisioningUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  issueRecoveryCodes,
  verifyTotpToken,
} from "@/server/auth/mfa";

async function requireStaffSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("No autenticado.");
  }
  return session;
}

/**
 * Starts (or resumes) TOTP enrollment for the current staff session.
 * Reuses an existing, not-yet-confirmed secret rather than generating a new
 * one on every page load — otherwise reloading the page mid-enrollment
 * would invalidate a QR code the user already scanned into their
 * authenticator app.
 */
export async function startMfaEnrollment(): Promise<{
  qrDataUrl: string;
  manualKey: string;
}> {
  const session = await requireStaffSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true, totpSecret: true, mfaEnabled: true },
  });

  if (user.mfaEnabled) {
    throw new Error("MFA ya está habilitado para esta cuenta.");
  }

  const secretBase32 = user.totpSecret
    ? decryptTotpSecret(user.totpSecret)
    : generateTotpSecret();

  if (!user.totpSecret) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpSecret: encryptTotpSecret(secretBase32) },
    });
  }

  const uri = buildTotpProvisioningUri(user.email, secretBase32);
  const qrDataUrl = await QRCode.toDataURL(uri);
  return { qrDataUrl, manualKey: secretBase32 };
}

/**
 * Confirms enrollment: verifies the submitted TOTP code against the pending
 * secret and, only on success, issues recovery codes and flips
 * User.mfaEnabled — the moment enforcement (server/auth/staff.ts's
 * authorize()) starts requiring a second factor for this account.
 */
export async function confirmMfaEnrollment(
  code: string
): Promise<{ ok: true; recoveryCodes: string[] } | { ok: false; error: string }> {
  const session = await requireStaffSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { totpSecret: true, mfaEnabled: true },
  });

  if (user.mfaEnabled) {
    return { ok: false, error: "MFA ya está habilitado para esta cuenta." };
  }
  if (!user.totpSecret) {
    return { ok: false, error: "Primero genera un código QR." };
  }

  const secretBase32 = decryptTotpSecret(user.totpSecret);
  if (!verifyTotpToken(secretBase32, code.trim())) {
    return {
      ok: false,
      error:
        "Código inválido. Verifica la hora de tu dispositivo e inténtalo de nuevo.",
    };
  }

  const recoveryCodes = await issueRecoveryCodes(session.user.id);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaEnabled: true },
  });

  return { ok: true, recoveryCodes };
}
