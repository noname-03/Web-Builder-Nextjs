import "server-only";
import type { AiMode, AiStatus } from "@prisma/client";
import { db } from "@/server/db";

export async function createGenerationRecord(input: {
  userId: string;
  pageId: string | null;
  providerId: string | null;
  mode: AiMode;
  prompt: string;
  status: AiStatus;
  errorCode?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  catalogVersion?: string | null;
  durationMs: number;
}): Promise<void> {
  await db.aiGeneration.create({
    data: {
      userId: input.userId,
      pageId: input.pageId,
      providerId: input.providerId,
      mode: input.mode,
      prompt: input.prompt.slice(0, 4000),
      status: input.status,
      errorCode: input.errorCode ?? null,
      promptTokens: input.promptTokens ?? null,
      completionTokens: input.completionTokens ?? null,
      catalogVersion: input.catalogVersion ?? null,
      durationMs: input.durationMs,
    },
  });
}

export async function countGenerationsSince(userId: string, since: Date): Promise<number> {
  return db.aiGeneration.count({ where: { userId, createdAt: { gte: since } } });
}

export async function listRecentGenerations(userId: string, take = 10) {
  return db.aiGeneration.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      mode: true,
      status: true,
      prompt: true,
      durationMs: true,
      promptTokens: true,
      completionTokens: true,
      createdAt: true,
    },
  });
}

export async function deleteGenerationsForUser(userId: string): Promise<number> {
  const result = await db.aiGeneration.deleteMany({ where: { userId } });
  return result.count;
}

export async function deleteGenerationsOlderThan(date: Date, batchSize = 500): Promise<number> {
  const rows = await db.aiGeneration.findMany({
    where: { createdAt: { lt: date } },
    take: batchSize,
    select: { id: true },
  });

  if (rows.length === 0) return 0;

  const result = await db.aiGeneration.deleteMany({
    where: { id: { in: rows.map((row) => row.id) } },
  });
  return result.count;
}
