import "server-only";
import type { Role } from "@prisma/client";
import { db } from "@/server/db";

export type SessionRecord = {
  id: string;
  tokenHash: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
  };
};

export async function createSessionRecord(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<void> {
  await db.session.create({
    data: {
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    },
  });
}

export async function findActiveSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
  return db.session.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      tokenHash: true,
      expiresAt: true,
      user: {
        select: { id: true, email: true, name: true, role: true, isActive: true },
      },
    },
  });
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await db.session.deleteMany({ where: { tokenHash } });
}

export async function deleteSessionsByUserId(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

export async function extendSession(expiresAt: Date, tokenHash: string): Promise<void> {
  await db.session.update({ where: { tokenHash }, data: { expiresAt } });
}

export async function deleteExpiredSessions(): Promise<void> {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
