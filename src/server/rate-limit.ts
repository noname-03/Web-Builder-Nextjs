import "server-only";
import { AppError } from "@/lib/errors";
import {
  clearFailures,
  countRecentFailures,
  recordLoginAttempt,
} from "@/server/repositories/login-attempt-repository";

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

export async function assertLoginAllowed(input: { email: string; ipAddress: string }): Promise<void> {
  const failures = await countRecentFailures(input);
  if (failures >= MAX_FAILURES) {
    throw new AppError(
      "RATE_LIMITED",
      `Terlalu banyak percobaan. Coba lagi dalam ${WINDOW_MINUTES} menit.`,
    );
  }
}

export async function registerLoginAttempt(input: {
  email: string;
  ipAddress: string;
  success: boolean;
}): Promise<void> {
  await recordLoginAttempt(input);
  if (input.success) {
    await clearFailures({ email: input.email, ipAddress: input.ipAddress });
  }
}
