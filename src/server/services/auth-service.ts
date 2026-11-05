import "server-only";
import type { Role } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyDummyPassword, verifyPassword } from "@/server/auth/password";
import { createUserSession, destroySession } from "@/server/auth/session";
import { isUniqueConstraintError } from "@/server/prisma-errors";
import { assertLoginAllowed, registerLoginAttempt } from "@/server/rate-limit";
import { createUser, findUserByEmail } from "@/server/repositories/user-repository";

type ClientMeta = { userAgent: string | null; ipAddress: string | null };

export async function registerUser(
  input: { name: string; email: string; password: string } & ClientMeta,
): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError("CONFLICT", "Email sudah terdaftar.", { email: ["Email sudah terdaftar."] });
  }

  const passwordHash = await hashPassword(input.password);

  let userId: string;
  try {
    const user = await createUser({ email, name: input.name.trim(), passwordHash });
    userId = user.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("CONFLICT", "Email sudah terdaftar.", { email: ["Email sudah terdaftar."] });
    }
    throw error;
  }

  await createUserSession({ userId, userAgent: input.userAgent, ipAddress: input.ipAddress });
}

export async function loginUser(
  input: { email: string; password: string } & ClientMeta,
): Promise<{ id: string; role: Role }> {
  const email = input.email.trim().toLowerCase();
  await assertLoginAllowed({ email, ipAddress: input.ipAddress ?? "unknown" });

  const user = await findUserByEmail(email);

  if (!user) {
    await verifyDummyPassword(input.password);
    await registerLoginAttempt({ email, ipAddress: input.ipAddress ?? "unknown", success: false });
    throw new AppError("VALIDATION", "Email atau password salah.");
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  const success = passwordValid && user.isActive;

  await registerLoginAttempt({ email, ipAddress: input.ipAddress ?? "unknown", success });

  if (!success) {
    throw new AppError("VALIDATION", "Email atau password salah.");
  }

  await createUserSession({ userId: user.id, userAgent: input.userAgent, ipAddress: input.ipAddress });

  return { id: user.id, role: user.role };
}

export async function logoutUser(): Promise<void> {
  await destroySession();
}
