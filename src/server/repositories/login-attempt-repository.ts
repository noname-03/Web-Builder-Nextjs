import "server-only";
import { db } from "@/server/db";

export async function countRecentFailures(input: { email: string; ipAddress: string }): Promise<number> {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  return db.loginAttempt.count({
    where: {
      email: input.email,
      ipAddress: input.ipAddress,
      success: false,
      createdAt: { gte: since },
    },
  });
}

export async function recordLoginAttempt(input: {
  email: string;
  ipAddress: string;
  success: boolean;
}): Promise<void> {
  await db.loginAttempt.create({ data: input });
}

export async function clearFailures(input: { email: string; ipAddress: string }): Promise<void> {
  await db.loginAttempt.deleteMany({
    where: { email: input.email, ipAddress: input.ipAddress, success: false },
  });
}

export async function deleteOldLoginAttempts(): Promise<void> {
  await db.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}
