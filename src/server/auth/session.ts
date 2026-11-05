import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { env } from "@/lib/env";
import {
  createSessionRecord,
  deleteExpiredSessions,
  deleteSessionByTokenHash,
  extendSession,
  findActiveSessionByTokenHash,
} from "@/server/repositories/session-repository";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  tokenHash: string;
  expiresAt: Date;
};

const SESSION_TTL_MS = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

async function clearCookieSafely(): Promise<void> {
  try {
    const store = await cookies();
    store.delete(env.SESSION_COOKIE_NAME);
  } catch {
    // Cookies can only be modified in Server Actions or Route Handlers.
  }
}

export async function createUserSession(input: {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await createSessionRecord({
    userId: input.userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: input.userAgent?.slice(0, 255) ?? null,
    ipAddress: input.ipAddress?.slice(0, 45) ?? null,
  });

  const store = await cookies();
  store.set(env.SESSION_COOKIE_NAME, token, cookieOptions(Math.floor(SESSION_TTL_MS / 1000)));

  await deleteExpiredSessions();
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(env.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await findActiveSessionByTokenHash(tokenHash);

  if (!session) {
    await clearCookieSafely();
    return null;
  }

  if (!session.user.isActive) {
    await deleteSessionByTokenHash(tokenHash);
    await clearCookieSafely();
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    tokenHash,
    expiresAt: session.expiresAt,
  };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(env.SESSION_COOKIE_NAME)?.value;
  if (token) {
    await deleteSessionByTokenHash(hashToken(token));
  }
  await clearCookieSafely();
}

export async function extendSessionIfNeeded(session: SessionUser): Promise<void> {
  const remaining = session.expiresAt.getTime() - Date.now();
  if (remaining > SESSION_TTL_MS / 2) return;

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await extendSession(expiresAt, session.tokenHash);

  try {
    const store = await cookies();
    const token = store.get(env.SESSION_COOKIE_NAME)?.value;
    if (token) {
      store.set(env.SESSION_COOKIE_NAME, token, cookieOptions(Math.floor(SESSION_TTL_MS / 1000)));
    }
  } catch {
    // Ignore when cookies are read-only.
  }
}
