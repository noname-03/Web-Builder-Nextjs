import "server-only";
import { notFound, redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { getSession, type SessionUser } from "@/server/auth/session";

export async function getOptionalUser(): Promise<SessionUser | null> {
  return getSession();
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new AppError("UNAUTHENTICATED", "Anda harus masuk terlebih dahulu.");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new AppError("FORBIDDEN", "Anda tidak memiliki akses.");
  }
  return user;
}

export async function requireUserOrRedirect(callbackUrl: string): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

export async function requireAdminOrNotFound(): Promise<SessionUser> {
  const user = await requireUserOrRedirect("/admin");
  if (user.role !== "ADMIN") {
    notFound();
  }
  return user;
}
