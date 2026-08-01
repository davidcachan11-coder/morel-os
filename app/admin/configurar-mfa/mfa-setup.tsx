"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmMfaEnrollment, startMfaEnrollment } from "./actions";

type Stage = "loading" | "scan" | "recovery-codes" | "error";

export function MfaSetup() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startMfaEnrollment()
      .then((result) => {
        setQrDataUrl(result.qrDataUrl);
        setManualKey(result.manualKey);
        setStage("scan");
      })
      .catch(() => setStage("error"));
  }, []);

  function handleConfirm(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await confirmMfaEnrollment(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRecoveryCodes(result.recoveryCodes);
      setStage("recovery-codes");
    });
  }

  if (stage === "loading") {
    return <p className="text-sm text-muted-foreground">Generando código…</p>;
  }

  if (stage === "error") {
    return (
      <p className="text-sm text-destructive">
        No se pudo iniciar la configuración. Actualiza la página e inténtalo
        de nuevo.
      </p>
    );
  }

  if (stage === "recovery-codes") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Guarda estos códigos de recuperación en un lugar seguro. Cada uno
          se puede usar una sola vez si pierdes acceso a tu app de
          autenticación. No volverán a mostrarse.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-4 font-mono text-sm">
          {recoveryCodes.map((recoveryCode) => (
            <span key={recoveryCode}>{recoveryCode}</span>
          ))}
        </div>
        <Button className="w-full" onClick={() => router.push("/admin")}>
          Ya guardé mis códigos — continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Escanea este código con tu app de autenticación (Google
        Authenticator, Authy, 1Password, etc.).
      </p>
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL, not a static asset
        <img
          src={qrDataUrl}
          alt="Código QR para configurar la autenticación de dos pasos"
          className="mx-auto h-48 w-48"
        />
      )}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          ¿No puedes escanear? Ingresa esta clave manualmente:
        </span>
        <code className="break-all rounded bg-muted/40 px-2 py-1 text-xs">
          {manualKey}
        </code>
      </div>
      <form onSubmit={handleConfirm} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Código de verificación</Label>
          <Input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Verificando…" : "Confirmar y activar"}
        </Button>
      </form>
    </div>
  );
}
