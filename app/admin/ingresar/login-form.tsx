"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkNeedsSecondFactor, signInStaff } from "./actions";

type Step = "credentials" | "second-factor";

export function StaffLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCredentialsSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await checkNeedsSecondFactor(email, password);
      if (!result.ok) {
        setError("credentials");
        return;
      }
      if (result.needsSecondFactor) {
        setStep("second-factor");
        return;
      }
      const signInResult = await signInStaff({ email, password });
      if (signInResult?.error) {
        setError(signInResult.error);
        return;
      }
      router.push("/admin");
    });
  }

  function handleSecondFactorSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const signInResult = await signInStaff({
        email,
        password,
        ...(useRecoveryCode ? { recoveryCode: code } : { totpCode: code }),
      });
      if (signInResult?.error) {
        setError(signInResult.error);
        return;
      }
      router.push("/admin");
    });
  }

  if (step === "second-factor") {
    return (
      <form onSubmit={handleSecondFactorSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">
            {useRecoveryCode ? "Código de recuperación" : "Código de verificación"}
          </Label>
          <Input
            id="code"
            name="code"
            type="text"
            inputMode={useRecoveryCode ? "text" : "numeric"}
            autoComplete="one-time-code"
            autoFocus
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={useRecoveryCode ? "xxxxx-xxxxx" : "123456"}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">
            {useRecoveryCode
              ? "Código de recuperación inválido."
              : "Código inválido. Verifica la hora de tu dispositivo e inténtalo de nuevo."}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Verificando…" : "Verificar"}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={() => {
            setUseRecoveryCode((prev) => !prev);
            setCode("");
            setError(null);
          }}
        >
          {useRecoveryCode
            ? "Usar código de la app de autenticación"
            : "Usar un código de recuperación"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">
          Email o contraseña incorrectos.
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
