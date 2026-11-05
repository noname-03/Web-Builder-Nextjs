"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormError, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction } from "@/features/auth/actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(loginAction, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FormError messages={fieldErrors?.email} />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        <FormError messages={fieldErrors?.password} />
      </div>

      {state && !state.ok ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert" aria-live="polite">
          {state.error.message}
        </p>
      ) : null}

      <SubmitButton className="w-full" pendingText="Masuk...">
        Masuk
      </SubmitButton>

      <p className="text-center text-sm text-slate-600">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          Daftar
        </Link>
      </p>
    </form>
  );
}
