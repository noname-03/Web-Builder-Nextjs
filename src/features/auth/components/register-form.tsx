"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormError, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerAction } from "@/features/auth/actions";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="name">Nama</Label>
        <Input id="name" name="name" autoComplete="name" required />
        <FormError messages={fieldErrors?.name} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FormError messages={fieldErrors?.email} />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FormError messages={fieldErrors?.password} />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Konfirmasi password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <FormError messages={fieldErrors?.confirmPassword} />
      </div>

      {state && !state.ok ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert" aria-live="polite">
          {state.error.message}
        </p>
      ) : null}

      <SubmitButton className="w-full" pendingText="Mendaftar...">
        Daftar
      </SubmitButton>

      <p className="text-center text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Masuk
        </Link>
      </p>

      <p className="text-center text-xs text-slate-500">
        Password minimal 8 karakter, mengandung huruf dan angka.
      </p>
    </form>
  );
}
