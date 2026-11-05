"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/result";
import { getClientMeta, invalid, safeCallbackUrl, toActionError } from "@/server/action-error";
import { loginUser, logoutUser, registerUser } from "@/server/services/auth-service";
import { loginSchema, registerSchema } from "@/features/auth/schemas";

export async function registerAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const meta = await getClientMeta();
    await registerUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      ...meta,
    });
  } catch (error) {
    return toActionError(error, "registerAction");
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  let callbackUrl = "/dashboard";

  try {
    const meta = await getClientMeta();
    await loginUser({
      email: parsed.data.email,
      password: parsed.data.password,
      ...meta,
    });
    callbackUrl = safeCallbackUrl(parsed.data.callbackUrl);
  } catch (error) {
    return toActionError(error, "loginAction");
  }

  redirect(callbackUrl);
}

export async function logoutAction(): Promise<void> {
  await logoutUser();
  redirect("/");
}
